$.ajax({ url: './../src/pdfannotate.min.js', dataType: 'script', async: false, cache: false });

class PanningHandler {
  constructor() {
    // Variables to track the mouse position and the scroll position
    this.isEnabled = false;
    this.isPanning = false;
    this.startX;
    this.startY;
    this.scrollLeft;
    this.scrollTop;

    window.addEventListener('mousedown', (e) => {
      if (!this.isEnabled) return;
      // Enable panning mode
      this.isPanning = true;

      // Record the initial mouse position and scroll position
      this.startX = e.pageX - window.scrollX;
      this.startY = e.pageY - window.scrollY;
      this.scrollLeft = window.scrollX;
      this.scrollTop = window.scrollY;

      // Change the cursor to indicate panning
      document.body.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      // Only perform panning when the mouse is pressed
      if (!this.isPanning) return;

      // Calculate the new scroll positions based on mouse movement
      const x = e.pageX - window.scrollX;
      const y = e.pageY - window.scrollY;

      const walkX = x - this.startX; // Distance moved horizontally
      const walkY = y - this.startY; // Distance moved vertically

      window.scrollTo({
        left: this.scrollLeft - walkX,
        top: this.scrollTop - walkY,
      });
    });

    window.addEventListener('mouseup', () => {
      if (!this.isPanning) return;
      // Disable panning mode
      this.isPanning = false;

      // Reset the cursor
      document.body.style.cursor = 'default';
    });
  }
}

var panningHandler = new PanningHandler();
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
pdf.setBrushSize($('#brush-size').val());
var color = $('.color-tool.active').get(0).style.backgroundColor;
var opacity = $('.color-tool.active').get(0).style.opacity;
pdf.setColor(color, opacity);
pdf.setFillColor(color, opacity);
panningHandler.isEnabled = true;

function changeActiveTool(event) {
  var element = $(event.target).hasClass('tool-button')
    ? $(event.target)
    : $(event.target).parents('.tool-button').first();
  $('.tool-button.active').removeClass('active');
  $(element).addClass('active');
  panningHandler.isEnabled = false;
}

function enableMove(event) {
  event.preventDefault();
  changeActiveTool(event);
  pdf.disableDrawingTool();
  panningHandler.isEnabled = true;
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
  withSpinner('upload-button', pdf.savePdf('upload', { url: 'upload.php' }));
}

function downloadPDF() {
  withSpinner('download-button', pdf.savePdf('download', { filename: 'output.pdf' })); // save with given file name
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

function withSpinner(id, callable) {
  const element = document.getElementById(id);
  const originalContent = element.innerHTML;
  element.innerHTML = '<i class="fa fa-spinner"></i>Loading...';

  // Call the function asynchronously
  callable.then((success) => {
    if (success) {
      element.innerHTML = '<i class="fa fa-check"></i>Success!';
      setTimeout(() => {
        element.innerHTML = originalContent; // Revert to original content
      }, 3000);
    } else {
      element.innerHTML = originalContent;
      alert('PDF save failed');
    }
  });
}

$(function () {
  $('.color-tool').click(function () {
    $('.color-tool.active').removeClass('active');
    $(this).addClass('active');
    color = $(this).get(0).style.backgroundColor;
    alpha = $(this).get(0).style.opacity;
    pdf.setColor(color, alpha);
    pdf.setFillColor(color, alpha);
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

  window.addEventListener(
    'wheel',
    function (event) {
      if (event.ctrlKey) {
        event.preventDefault();
        pdf.zoom(event.deltaY);
      }
    },
    { passive: false }
  );
});
