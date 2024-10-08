# FabricJS layer on top of Mozilla's PDFJS to add ANNOTATIONS

![Alt text](./Screenshot.png?raw=true 'Screenshot')

# Features

- Supports PDFs with multiple pages

- Free draw tool

- Add text

- Add arrows, rectangles, ellipses

- Add images

- Change colors

- Change Brush size

- Change Font size

- Every object can be resized

- Serialize all canvas data into JSON and re-draw

- Delete individual objects

- Clear page

- Download PDF file with annotations

- Upload PDF to remote API endpoint

**Important: exported file will be a PDF with set of images. So you won't be able to use functions like text selections. trying my best to add the text layer. Due to lack of PDFJs documentation about this section progress is very slow. If anyone interested you can check the progress on `dev` branch.**

# Usage

```javascript
var pdf = new PDFAnnotate('pdf-container-id', 'http://url-to.pdf');

pdf.enableSelector(); // Enable moving tool

pdf.enablePencil(); // Enable pencil tool

pdf.enableAddText(); // Enable add text tool

pdf.enableAddArrow(); // Enable add arrow tool(Supports optional on draw success callback)

pdf.enableRectangle(); // Adds a rectangle

pdf.enableEllipse(); // Adds a rectangle

pdf.addImageToCanvas(); // Add an image

pdf.deleteSelectedObject(); // Delete selected object

pdf.clearActivePage(); // Clear current page

pdf.savePdf('download', { filename: 'sample.pdf' }); // Save PDF with name sample.pdf

pdf.savePdf('upload', { url: 'upload.php' }); // Upload PDF to API endpoint

pdf.serializePdf(function (serializedString) {}); // returns JSON string with canvas data

pdf.loadFromJSON(serializedJSON); // continue edit with saved JSON. To do this on page load use `ready` option(scripts.js line 9)

pdf.setColor(color, alpha); // Set color for pencil/arrow and rectangle/ellipse borders (Example: pdf.setColor(red) , pdf.setColor('#fff'), pdf.setColor('rgba(255,0,0), 0.5)'))

pdf.setFillColor(color, alpha); // Set fill color for rectangle/ellipse tool (Example: pdf.setFillColor(red) , pdf.setFillColor('#fff'), default is transparent)

pdf.setBrushSize(width); // Set stroke size for pencil tool and border size for rectangle/ellipse (Example: pdf.setBrushSize(5))

pdf.setFontSize(font_size); // Set font size for text tool (Example: pdf.setFontSize(18))
```
