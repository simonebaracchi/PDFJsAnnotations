fabric.InteractiveRectangle = fabric.util.createClass(fabric.Rect, {
  type: 'InteractiveRectangle',

  initialize: function (options) {
    options || (options = {});
    this.callSuper('initialize', options);
  },

  toObject: function () {
    return fabric.util.object.extend(this.callSuper('toObject'));
  },
});

var Rectangle = (function () {
  function Rectangle(canvas, brush, callback) {
    this.canvas = canvas;
    this.className = 'Rectangle';
    this.isDrawing = false;
    this.brush = brush;
    this.callback = callback;
    this.bindEvents();
  }

  Rectangle.prototype.stop = function () {
    this.unBindEvents();
  };

  Rectangle.prototype.bindEvents = function () {
    var inst = this;
    inst.canvas.on('mouse:down', function (o) {
      inst.onMouseDown(o);
    });
    inst.canvas.on('mouse:move', function (o) {
      inst.onMouseMove(o);
    });
    inst.canvas.on('mouse:up', function (o) {
      inst.onMouseUp(o);
    });
    inst.canvas.on('object:moving', function (o) {
      inst.disable();
    });
  };

  Rectangle.prototype.unBindEvents = function () {
    var inst = this;
    inst.canvas.off('mouse:down');
    inst.canvas.off('mouse:up');
    inst.canvas.off('mouse:move');
    inst.canvas.off('object:moving');
  };

  Rectangle.prototype.onMouseUp = function (o) {
    var inst = this;
    inst.disable();
    if (inst.callback) inst.callback();
  };

  Rectangle.prototype.onMouseMove = function (o) {
    var inst = this;
    if (!inst.isEnable()) {
      return;
    }

    var pointer = inst.canvas.getPointer(o.e);
    var activeObj = inst.canvas.getActiveObject();
    activeObj.set({
      width: pointer.x - activeObj.left,
      height: pointer.y - activeObj.top,
    });
    activeObj.setCoords();
    inst.canvas.renderAll();
  };

  Rectangle.prototype.onMouseDown = function (o) {
    var inst = this;
    inst.enable();
    var pointer = inst.canvas.getPointer(o.e);

    var line = new fabric.InteractiveRectangle({
      strokeWidth: inst.brush.borderSize,
      fill: inst.brush.color ? inst.brush.color : 'red',
      stroke: inst.brush.color ? inst.brush.color : 'red',
      hasBorders: false,
      hasControls: true,
      selectable: true,
      left: pointer.x,
      top: pointer.y,
    });

    inst.canvas.add(line).setActiveObject(line);
  };

  Rectangle.prototype.isEnable = function () {
    return this.isDrawing;
  };

  Rectangle.prototype.enable = function () {
    this.isDrawing = true;
  };

  Rectangle.prototype.disable = function () {
    this.isDrawing = false;
  };

  return Rectangle;
})();
