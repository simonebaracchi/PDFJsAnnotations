var Brush = function (onUpdateCallback) {
  this.color = '#212121';
  this.borderColor = '#000000';
  this.forceFillOpacity = false;
  this.fillOpacity = 0;
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

Brush.prototype.setColor = function (color) {
  var inst = this;
  if (inst.forceFillOpacity) {
    color = new fabric.Color(color);
    color.setAlpha(inst.fillOpacity);
    color = color.toRgba();
  }
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

Brush.prototype.setFillOpacity = function (alpha) {
  var inst = this;
  inst.forceFillOpacity = true;
  inst.fillOpacity = alpha;
  if (typeof inst.onUpdateCallback === 'function') {
    inst.onUpdateCallback(inst);
  }
};
