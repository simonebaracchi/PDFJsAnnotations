var Brush = function (onUpdateCallback) {
  this.color = '#212121';
  this.borderColor = '#000000';
  this.alpha = 1;
  this.brushSize = 1;
  this.borderSize = 1;
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
  inst.alpha = alpha;
  inst.color = color;
  if (typeof inst.onUpdateCallback === 'function') {
    inst.onUpdateCallback(inst);
  }
};

Brush.prototype.setBorderColor = function (color) {
  var inst = this;
  inst.borderColor = color;
  if (typeof inst.onUpdateCallback === 'function') {
    inst.onUpdateCallback(inst);
  }
};

Brush.prototype.setBorderSize = function (size) {
  var inst = this;
  inst.borderSize = size;
  if (typeof inst.onUpdateCallback === 'function') {
    inst.onUpdateCallback(inst);
  }
};
