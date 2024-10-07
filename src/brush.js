var Brush = function (onUpdateCallback) {
  this.color = '#212121';
  this.fillColor = '#00000000';
  this.brushSize = 1;
  this.onUpdateCallback = onUpdateCallback;
};

Brush.prototype.setBrushSize = function (size) {
  var inst = this;
  inst.brushSize = parseInt(size, 10) || 1;
  if (typeof inst.onUpdateCallback === 'function') {
    inst.onUpdateCallback(inst);
  }
};

Brush.prototype.setColor = function (color, alpha = 1) {
  var inst = this;
  color = new fabric.Color(color);
  color.setAlpha(alpha);
  color = color.toRgba();
  inst.color = color;
  if (typeof inst.onUpdateCallback === 'function') {
    inst.onUpdateCallback(inst);
  }
};

Brush.prototype.setFillColor = function (color, alpha = 1) {
  var inst = this;
  color = new fabric.Color(color);
  color.setAlpha(alpha);
  color = color.toRgba();
  inst.fillColor = color;
  if (typeof inst.onUpdateCallback === 'function') {
    inst.onUpdateCallback(inst);
  }
};
