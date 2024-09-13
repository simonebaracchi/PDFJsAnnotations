$.ajax({ url: './../src/pdfannotate.min.js', dataType: 'script', async: false, cache: false });

var pdf = new PDFAnnotate('pdf-container', 'sample.pdf', {
  onPageUpdated(page, oldData, newData) {
    console.log(page, oldData, newData);
  },
  ready() {
    console.log('Plugin initialized successfully');
    pdf.loadFromJSON(sampleOutput);

    $('html').keyup(function (e) {
      if (e.keyCode == 46) {
        pdf.deleteSelectedObject();
      }
    });
  },
  scale: 1.5,
});
pdf.setBorderSize(1);
pdf.setBrushSize($('#brush-size').val());
pdf.setColor($('.color-tool.active').get(0).style.backgroundColor, $('.color-tool.active').get(0).style.opacity);

function changeActiveTool(event) {
  var element = $(event.target).hasClass('tool-button')
    ? $(event.target)
    : $(event.target).parents('.tool-button').first();
  $('.tool-button.active').removeClass('active');
  $(element).addClass('active');
}

function enableSelector(event) {
  event.preventDefault();
  changeActiveTool(event);
  pdf.enableSelector();
}

function enablePencil(event) {
  event.preventDefault();
  changeActiveTool(event);
  pdf.enablePencil();
}

function enableAddText(event) {
  event.preventDefault();
  changeActiveTool(event);
  pdf.enableAddText();
}

function enableAddArrow(event) {
  event.preventDefault();
  changeActiveTool(event);
  pdf.enableAddArrow();
}

function addImage(event) {
  event.preventDefault();
  pdf.addImageToCanvas();
}

function enableRectangle(event) {
  event.preventDefault();
  changeActiveTool(event);
  pdf.enableRectangle();
}
function enableEllipse(event) {
  event.preventDefault();
  changeActiveTool(event);
  pdf.enableEllipse();
}

function deleteSelectedObject(event) {
  event.preventDefault();
  pdf.deleteSelectedObject();
}

function uploadPDF() {
  pdf.savePdf('upload', { url: 'upload.php' }); // save with given file name
}

function downloadPDF() {
  pdf.savePdf('download', { filename: 'output.pdf' }); // save with given file name
}

function clearPage() {
  pdf.clearActivePage();
}

function showPdfData() {
  pdf.serializePdf(function (string) {
    $('#dataModal .modal-body pre')
      .first()
      .text(JSON.stringify(JSON.parse(string), null, 4));
    PR.prettyPrint();
    $('#dataModal').modal('show');
  });
}

$(function () {
  $('.color-tool').click(function () {
    $('.color-tool.active').removeClass('active');
    $(this).addClass('active');
    color = $(this).get(0).style.backgroundColor;
    alpha = $(this).get(0).style.opacity;
    pdf.setColor(color, alpha);
  });

  $('#brush-size').change(function () {
    var width = $(this).val();
    pdf.setBrushSize(width);
  });

  $('#font-size').change(function () {
    var font_size = $(this).val();
    pdf.setFontSize(font_size);
  });

  window.addEventListener('beforeunload', function (e) {
    // trigger a confirmation dialog before leaving
    if (pdf.needSave) {
      e.preventDefault(); // For modern browsers
      e.returnValue = ''; // For legacy browsers
    }
  });
});
