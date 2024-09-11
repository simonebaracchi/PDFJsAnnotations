/**
 * PDFAnnotate v1.0.1
 * Author: Ravisha Heshan
 */

/*
$.ajax({ url: './brush.js', dataType: 'script', async: false, cache: false });
$.ajax({ url: './arrow.fabric.js', dataType: 'script', async: false, cache: false });
$.ajax({ url: './rect.fabric.js', dataType: 'script', async: false, cache: false });
$.ajax({ url: './ellipse.fabric.js', dataType: 'script', async: false, cache: false });
*/

const { PDFDocument, rgb } = PDFLib;

var PDFAnnotate = function (container_id, url, options = {}) {
  this.number_of_pages = 0;
  this.pages_rendered = 0;
  this.active_tool = 1; // 1 - Free hand, 2 - Text, 3 - Arrow, 4 - Rectangle, 5 - Ellipse
  this.active_tool_obj;
  this.fabricObjects = [];
  this.fabricObjectsData = [];
  this.font_size = 16;
  this.active_canvas = 0;
  this.container_id = container_id;
  this.origPdfBytes;
  this.textBoxText = 'Sample Text';
  this.format;
  this.orientation;
  this.autoConfirmBeforeDeletingObject = true;
  this.scale = 1.5;

  this.brush = new Brush(function (brush) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.freeDrawingBrush.color = brush.color;
      fabricObj.freeDrawingBrush.width = brush.brushSize;
    });
  });

  var inst = this;
  fetch(url).then(function (res) {
    var buffer = res.arrayBuffer();
    buffer.then(function (res) {
      inst.origPdfBytes = res;
      inst.initPDFjs();
    });
  });

  this.initPDFjs = function () {
    var loadingTask = pdfjsLib.getDocument({ data: inst.origPdfBytes });
    loadingTask.promise.then(
      function (pdf) {
        inst.scale = options.scale ? options.scale : inst.scale;
        inst.number_of_pages = pdf.numPages;

        for (var i = 1; i <= pdf.numPages; i++) {
          pdf.getPage(i).then(function (page) {
            if (typeof inst.format === 'undefined' || typeof inst.orientation === 'undefined') {
              var originalViewport = page.getViewport({ scale: 1 });
              inst.format = [originalViewport.width, originalViewport.height];
              inst.orientation = originalViewport.width > originalViewport.height ? 'landscape' : 'portrait';
            }
            var viewport = page.getViewport({ scale: inst.scale });

            var pageContainer = document.createElement('div');
            document.getElementById(inst.container_id).appendChild(pageContainer);
            $(pageContainer).attr('id', 'page-' + page.pageNumber + '-container');
            pageContainer.className = 'page-container';

            var pdfCanvas = document.createElement('canvas');
            pageContainer.appendChild(pdfCanvas);
            pdfCanvas.className = 'pdf-canvas';
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;
            $(pdfCanvas).attr('id', 'page-' + page.pageNumber + '-pdf-canvas');

            context = pdfCanvas.getContext('2d');
            var renderContext = {
              canvasContext: context,
              viewport: viewport,
            };

            var renderTask = page.render(renderContext);
            renderTask.promise.then(function () {
              inst.pages_rendered++;
              if (inst.pages_rendered == inst.number_of_pages) inst.initFabric();
            });
          });
        }
      },
      function (reason) {
        console.error(reason);
      }
    );
  };

  this.initFabric = function () {
    var inst = this;
    let canvases = $('#' + inst.container_id + ' .page-container');
    canvases.each(function (index, el) {
      var pdfCanvas = $(el).children().first()[0];
      var fabricCanvasWrapper = document.createElement('div');
      el.appendChild(fabricCanvasWrapper);
      $(fabricCanvasWrapper).css('position', 'absolute');
      $(fabricCanvasWrapper).css('height', $(pdfCanvas).height());
      $(fabricCanvasWrapper).css('width', $(pdfCanvas).width());
      $(fabricCanvasWrapper).css('left', $(pdfCanvas).position().left);
      $(fabricCanvasWrapper).css('top', $(pdfCanvas).position().top);
      $(fabricCanvasWrapper).css('z-index', '1');

      var fabricCanvas = document.createElement('canvas');
      fabricCanvasWrapper.appendChild(fabricCanvas);
      $(fabricCanvas).attr('id', 'page-' + index++ + '-fabric-canvas');

      var fabricObj = new fabric.Canvas(fabricCanvas.id, {
        freeDrawingBrush: {
          width: inst.brush.brushSize,
          color: inst.brush.color,
        },
      });
      fabricObj.setHeight($(pdfCanvas).height());
      fabricObj.setWidth($(pdfCanvas).width());

      inst.fabricObjects.push(fabricObj);
      if (typeof options.onPageUpdated == 'function') {
        fabricObj.on('object:added', function () {
          var oldValue = Object.assign({}, inst.fabricObjectsData[index]);
          inst.fabricObjectsData[index] = fabricObj.toJSON();
          options.onPageUpdated(index + 1, oldValue, inst.fabricObjectsData[index]);
        });
      }

      $(fabricObj.upperCanvasEl)
        .on('mousedown', function (e) {
          $(this).data('p0', {
            x: e.pageX,
            y: e.pageY,
          });
        })
        .on('mouseup', function (e) {
          var p0 = $(this).data('p0'),
            p1 = {
              x: e.pageX,
              y: e.pageY,
            },
            d = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));

          if (d < 4) {
            inst.active_canvas = index;
            inst.fabricClickHandler(e, fabricObj);
          }
        });

      fabricObj.on('after:render', function () {
        inst.fabricObjectsData[index] = fabricObj.toJSON();
        fabricObj.off('after:render');
      });

      if (index === canvases.length - 1 && typeof options.ready === 'function') {
        options.ready();
      }
    });
  };

  this.fabricClickHandler = function (event, fabricObj) {
    var inst = this;
    var toolObj;
    if (inst.active_tool == 2) {
      toolObj = new fabric.IText(inst.textBoxText, {
        left: event.clientX - fabricObj.upperCanvasEl.getBoundingClientRect().left,
        top: event.clientY - fabricObj.upperCanvasEl.getBoundingClientRect().top,
        fill: inst.brush.color,
        fontSize: inst.font_size,
        selectable: true,
      });
    }

    if (toolObj) {
      fabricObj.add(toolObj);
    }
  };
};

PDFAnnotate.prototype.disableDrawingTool = function () {
  var inst = this;
  if (inst.active_tool_obj) {
    $.each(inst.active_tool_obj, function (i, obj) {
      obj.stop();
    });
    inst.active_tool_obj = null;
  }
  inst.active_tool = 0;
};

PDFAnnotate.prototype.setDrawingTool = function (tool, objs) {
  var inst = this;
  if (inst.active_tool_obj) {
    console.log('Previous drawing tool was not disabled');
  }
  inst.active_tool = tool;
  inst.active_tool_obj = objs;
};

PDFAnnotate.prototype.enableSelector = function () {
  var inst = this;
  inst.disableDrawingTool();
  inst.setDrawingTool(0, null);
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = false;
    });
  }
};

PDFAnnotate.prototype.enablePencil = function () {
  var inst = this;
  inst.disableDrawingTool();
  inst.setDrawingTool(1, null);
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = true;
    });
  }
};

PDFAnnotate.prototype.enableAddText = function (text) {
  var inst = this;
  inst.disableDrawingTool();
  inst.setDrawingTool(2, null);
  if (typeof text === 'string') {
    inst.textBoxText = text;
  }
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = false;
    });
  }
};

PDFAnnotate.prototype.enableRectangle = function () {
  var inst = this;
  var objs = [];
  inst.disableDrawingTool();
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = false;
      objs.push(new Rectangle(fabricObj, inst.brush, null));
    });
  }
  inst.setDrawingTool(4, objs);
};

PDFAnnotate.prototype.enableEllipse = function () {
  var inst = this;
  var objs = [];
  inst.disableDrawingTool();
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = false;
      objs.push(new Ellipse(fabricObj, inst.brush, null));
    });
  }
  inst.setDrawingTool(5, objs);
};

PDFAnnotate.prototype.enableAddArrow = function (onDrawnCallback = null) {
  var inst = this;
  var objs = [];
  inst.disableDrawingTool();
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = false;
      objs.push(
        new Arrow(fabricObj, inst.brush, function () {
          if (typeof onDrawnCallback === 'function') {
            onDrawnCallback();
          }
        })
      );
    });
  }
  inst.setDrawingTool(3, objs);
};

PDFAnnotate.prototype.addImageToCanvas = function () {
  var inst = this;
  var fabricObj = inst.fabricObjects[inst.active_canvas];

  if (fabricObj) {
    var inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = '.jpg,.jpeg,.png,.PNG,.JPG,.JPEG';
    inputElement.onchange = function () {
      var reader = new FileReader();
      reader.addEventListener(
        'load',
        function () {
          inputElement.remove();
          var image = new Image();
          image.onload = function () {
            fabricObj.add(new fabric.Image(image));
          };
          image.src = this.result;
        },
        false
      );
      reader.readAsDataURL(inputElement.files[0]);
    };
    document.getElementsByTagName('body')[0].appendChild(inputElement);
    inputElement.click();
  }
};

PDFAnnotate.prototype.deleteSelectedObject = function () {
  var inst = this;
  var activeObject = inst.fabricObjects[inst.active_canvas].getActiveObject();
  if (activeObject) {
    if (inst.autoConfirmBeforeDeletingObject || confirm('Are you sure ?')) {
      inst.fabricObjects[inst.active_canvas].remove(activeObject);
    }
  }
};

PDFAnnotate.prototype.savePdf = async function (fileName) {
  var inst = this;
  const basePdfDoc = await PDFDocument.load(inst.origPdfBytes);

  inst.fabricObjects.forEach(async function (fabricObj, index) {
    var page = basePdfDoc.getPage(index);

    const image = await basePdfDoc.embedPng(
      fabricObj.toDataURL({
        format: 'png',
      })
    );

    page.drawImage(image, {
      x: fabricObj.x,
      y: fabricObj.y,
      width: fabricObj.width / inst.scale,
      height: fabricObj.height / inst.scale,
    });
  });

  const pdfBytes = await basePdfDoc.save();

  if (typeof fileName === 'undefined') {
    fileName = `${new Date().getTime()}.pdf`;
  }
  // Trigger the browser to download the PDF document
  download(pdfBytes, fileName, 'application/pdf');
};

PDFAnnotate.prototype.setFontSize = function (size) {
  this.font_size = size;
};

PDFAnnotate.prototype.setBrushSize = function (size) {
  this.brush.setBrushSize(size);
};

PDFAnnotate.prototype.setColor = function (color) {
  this.brush.setColor(color);
};

PDFAnnotate.prototype.setBorderColor = function (color) {
  this.brush.setBorderColor(color);
};

PDFAnnotate.prototype.setBorderSize = function (size) {
  this.brush.setBorderSize(size);
};

PDFAnnotate.prototype.setFillOpacity = function (alpha) {
  this.brush.setFillOpacity(alpha);
};

PDFAnnotate.prototype.clearActivePage = function () {
  var inst = this;
  var fabricObj = inst.fabricObjects[inst.active_canvas];
  var bg = fabricObj.backgroundImage;
  if (confirm('Are you sure?')) {
    fabricObj.clear();
    fabricObj.setBackgroundImage(bg, fabricObj.renderAll.bind(fabricObj));
  }
};

PDFAnnotate.prototype.serializePdf = function (callback) {
  var inst = this;
  var pageAnnotations = [];
  inst.fabricObjects.forEach(function (fabricObject) {
    fabricObject.clone(function (fabricObjectCopy) {
      fabricObjectCopy.setBackgroundImage(null);
      fabricObjectCopy.setBackgroundColor('');
      pageAnnotations.push(fabricObjectCopy);
      if (pageAnnotations.length === inst.fabricObjects.length) {
        var data = {
          page_setup: {
            format: inst.format,
            orientation: inst.orientation,
          },
          pages: pageAnnotations,
        };
        callback(JSON.stringify(data));
      }
    });
  });
};

PDFAnnotate.prototype.loadFromJSON = function (jsonData) {
  var inst = this;
  var { page_setup, pages } = jsonData;
  if (typeof pages === 'undefined') {
    pages = jsonData;
  }
  if (
    typeof page_setup === 'object' &&
    typeof page_setup.format === 'string' &&
    typeof page_setup.orientation === 'string'
  ) {
    inst.format = page_setup.format;
    inst.orientation = page_setup.orientation;
  }
  $.each(inst.fabricObjects, function (index, fabricObj) {
    if (pages.length > index) {
      fabricObj.loadFromJSON(pages[index], function () {
        inst.fabricObjectsData[index] = fabricObj.toJSON();
      });
    }
  });
};

PDFAnnotate.prototype.setDefaultTextForTextBox = function (text) {
  var inst = this;
  if (typeof text === 'string') {
    inst.textBoxText = text;
  }
};
