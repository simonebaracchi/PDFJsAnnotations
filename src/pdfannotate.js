/**
 * PDFAnnotate v1.0.1
 * Author: Ravisha Heshan
 */

const { PDFDocument, rgb } = PDFLib;

const TOOL_NONE = 0;
const TOOL_SELECTOR = 1;
const TOOL_FREEHAND = 2;
const TOOL_TEXT = 3;
const TOOL_ARROW = 4;
const TOOL_RECTANGLE = 5;
const TOOL_ELLIPSE = 6;

var PDFAnnotate = function (container_id, url, options = {}) {
  this.number_of_pages = 0;
  this.pages_rendered = 0;
  this.active_tool = TOOL_NONE;
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
  this.needSave = false;
  this.pdfjs;
  this.renderTasks = {};

  var inst = this;
  this.brush = new Brush(function (brush) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.freeDrawingBrush.color = brush.color;
      fabricObj.freeDrawingBrush.width = brush.brushSize;
    });
  });

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
        inst.pdfjs = pdf;
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
            pageContainer.className = 'pdfannotate-page-container';

            var pdfCanvas = document.createElement('canvas');
            pageContainer.appendChild(pdfCanvas);
            pdfCanvas.className = 'pdfannotate-pdf-canvas';
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
    let canvases = $('#' + inst.container_id + ' .pdfannotate-page-container');
    canvases.each(function (index, el) {
      var pdfCanvas = $(el).children().first()[0];
      var fabricCanvasWrapper = document.createElement('div');
      fabricCanvasWrapper.className = 'pdfannotate-fabric-canvas pdfannotate-locked';
      el.appendChild(fabricCanvasWrapper);
      $(fabricCanvasWrapper).attr('id', 'page-' + index + '-fabric-canvas-wrapper');
      $(fabricCanvasWrapper).css('height', $(pdfCanvas).height());
      $(fabricCanvasWrapper).css('width', $(pdfCanvas).width());
      $(fabricCanvasWrapper).css('z-index', '1');

      var fabricCanvas = document.createElement('canvas');
      fabricCanvasWrapper.appendChild(fabricCanvas);
      $(fabricCanvas).attr('id', 'page-' + index + '-fabric-canvas');
      var fabricObj = new fabric.Canvas(fabricCanvas.id);
      fabricObj.freeDrawingBrush.width = inst.brush.brushSize;
      fabricObj.freeDrawingBrush.color = inst.brush.color;
      fabricObj.setHeight($(pdfCanvas).height());
      fabricObj.setWidth($(pdfCanvas).width());
      fabricObj.setViewportTransform([inst.scale, 0, 0, inst.scale, 0, 0]);

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
          if (inst.active_tool == TOOL_NONE) return;
          if (inst.active_tool > TOOL_SELECTOR) {
            inst.needSave = true;
          }
          $(this).data('p0', {
            x: e.pageX,
            y: e.pageY,
          });
        })
        .on('mouseup', function (e) {
          inst.active_canvas = index;
          var p0 = $(this).data('p0');
          if (typeof p0 === 'undefined') return; // Mouse movement originated from offscreen
          var p1 = {
            x: e.pageX,
            y: e.pageY,
          };
          var d = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));

          if (d < 4) {
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
    if (inst.active_tool == TOOL_TEXT) {
      toolObj = new fabric.IText(inst.textBoxText, {
        left: (event.clientX - fabricObj.upperCanvasEl.getBoundingClientRect().left) / inst.scale,
        top: (event.clientY - fabricObj.upperCanvasEl.getBoundingClientRect().top) / inst.scale,
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

PDFAnnotate.prototype.zoom = function (amount) {
  var inst = this;
  if (inst.pdfjs == undefined) return;
  inst.scale *= 1 - amount / 1000;
  inst.fabricObjects.forEach(function (fabricObj, index) {
    inst.pdfjs.getPage(index + 1).then(function (page) {
      var viewport = page.getViewport({ scale: inst.scale });
      var pdfCanvas = $('#page-' + (index + 1) + '-pdf-canvas').get(0);
      pdfCanvas.height = viewport.height;
      pdfCanvas.width = viewport.width;
      var context = pdfCanvas.getContext('2d');
      var renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      inst.render(page, renderContext);

      var fabricCanvasWrapper = $('#page-' + index + '-fabric-canvas-wrapper').get(0);
      $(fabricCanvasWrapper).css('height', $(pdfCanvas).height());
      $(fabricCanvasWrapper).css('width', $(pdfCanvas).width());
      fabricObj.setHeight($(pdfCanvas).height());
      fabricObj.setWidth($(pdfCanvas).width());
      fabricObj.setViewportTransform([inst.scale, 0, 0, inst.scale, 0, 0]);
    });
  });
};

PDFAnnotate.prototype.render = function (page, renderContext) {
  var inst = this;
  if (page.pageNumber in inst.renderTasks) {
    inst.renderTasks[page.pageNumber] = renderContext;
    return;
  }
  var renderTask = page.render(renderContext);
  inst.renderTasks[page.pageNumber] = 'ongoing';

  renderTask.promise.then(function () {
    if (inst.renderTasks[page.pageNumber] == 'ongoing') {
      delete inst.renderTasks[page.pageNumber];
    } else {
      renderContext = inst.renderTasks[page.pageNumber];
      delete inst.renderTasks[page.pageNumber];
      inst.render(page, renderContext);
    }
  });
};

PDFAnnotate.prototype.disableDrawingTool = function () {
  var inst = this;
  if (inst.active_tool_obj) {
    $.each(inst.active_tool_obj, function (i, obj) {
      obj.stop();
    });
    inst.active_tool_obj = null;
  }
  inst.active_tool = TOOL_NONE;
  $.each(inst.fabricObjects, (index, fabricObj) => fabricObj.discardActiveObject().renderAll());
  $('.pdfannotate-fabric-canvas').addClass('pdfannotate-locked');
};

PDFAnnotate.prototype.setDrawingTool = function (tool, objs) {
  var inst = this;
  if (inst.active_tool_obj) {
    console.log('Previous drawing tool was not disabled');
  }
  inst.active_tool = tool;
  inst.active_tool_obj = objs;
  $('.pdfannotate-fabric-canvas').removeClass('pdfannotate-locked');
};

PDFAnnotate.prototype.enableSelector = function () {
  var inst = this;
  inst.disableDrawingTool();
  inst.setDrawingTool(TOOL_SELECTOR, null);
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = false;
    });
  }
};

PDFAnnotate.prototype.enablePencil = function () {
  var inst = this;
  inst.disableDrawingTool();
  inst.setDrawingTool(TOOL_FREEHAND, null);
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = true;
    });
  }
};

PDFAnnotate.prototype.enableAddText = function (text) {
  var inst = this;
  inst.disableDrawingTool();
  inst.setDrawingTool(TOOL_TEXT, null);
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
  inst.setDrawingTool(TOOL_RECTANGLE, objs);
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
  inst.setDrawingTool(TOOL_ELLIPSE, objs);
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
  inst.setDrawingTool(TOOL_ARROW, objs);
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
          inst.needSave = true;
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

PDFAnnotate.prototype.savePdf = async function (method, options) {
  var inst = this;
  options = options ?? {};
  const basePdfDoc = await PDFDocument.load(inst.origPdfBytes);

  inst.fabricObjects.forEach(async function (fabricObj, index) {
    var page = basePdfDoc.getPage(index);
    const rotationAngle = page.getRotation();

    var renderingScale = 180 / 72; // try to always render at 180 dpi
    var viewHeight = fabricObj.height;
    var viewWidth = fabricObj.width;
    fabricObj.setHeight(viewHeight / (inst.scale / renderingScale));
    fabricObj.setWidth(viewWidth / (inst.scale / renderingScale));
    fabricObj.setViewportTransform([renderingScale, 0, 0, renderingScale, 0, 0]);

    const image = await basePdfDoc.embedPng(
      fabricObj.toDataURL({
        format: 'png',
      })
    );

    var imageX = 0;
    var imageY = 0;
    if (rotationAngle.angle == 90) {
      imageX = fabricObj.height / renderingScale;
    }

    page.drawImage(image, {
      x: imageX,
      y: imageY,
      width: fabricObj.width / renderingScale,
      height: fabricObj.height / renderingScale,
      rotate: rotationAngle,
    });
    // restore original size
    fabricObj.setHeight(viewHeight);
    fabricObj.setWidth(viewWidth);
    fabricObj.setViewportTransform([inst.scale, 0, 0, inst.scale, 0, 0]);
  });

  const pdfBytes = await basePdfDoc.save();

  if (method == 'download') {
    fileName = options.filename;
    if (typeof fileName === 'undefined') {
      fileName = `${new Date().getTime()}.pdf`;
    }
    // Trigger the browser to download the PDF document
    download(pdfBytes, fileName, 'application/pdf');
    inst.needSave = false;
    return true;
  } else if (method == 'upload') {
    try {
      const params = new URLSearchParams(options.requestArgs);
      const formData = new FormData();
      formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }));
      const request = await fetch(`${options.url}?${params.toString()}`, {
        method: 'POST',
        body: formData,
      });
      var response = await request.json();
      var message = response.statusText ?? 'No response from server';
      if (response.ok) {
        console.log(message);
        inst.needSave = false;
        return true;
      } else {
        console.error('Failed to send PDF: ' + message);
        return false;
      }
    } catch (error) {
      console.error('Error uploading PDF: ' + error);
      return false;
    }
  }
};

PDFAnnotate.prototype.setFontSize = function (size) {
  this.font_size = size;
};

PDFAnnotate.prototype.setBrushSize = function (size) {
  this.brush.setBrushSize(size);
};

PDFAnnotate.prototype.setColor = function (color, alpha = 1) {
  this.brush.setColor(color, alpha);
};

PDFAnnotate.prototype.setFillColor = function (color, alpha = 1) {
  this.brush.setFillColor(color, alpha);
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
