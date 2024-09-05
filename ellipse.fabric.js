fabric.InteractiveEllipse = fabric.util.createClass(fabric.Ellipse, {

  type: 'InteractiveEllipse',

  initialize: function(options) {
    options || (options = {});
    this.callSuper('initialize', options);
  },

  toObject: function() {
    return fabric.util.object.extend(this.callSuper('toObject'));
  },
});

var Ellipse = (function() {
  function Ellipse(canvas, color, borderSize, callback) {
    this.canvas = canvas;
    this.className = 'Ellipse';
    this.isDrawing = false;
    this.color = color;
    this.borderSize = borderSize;
    this.callback = callback;
    this.bindEvents();
  }

  Ellipse.prototype.bindEvents = function() {
    var inst = this;
    inst.canvas.on('mouse:down', function(o) {
      inst.onMouseDown(o);
    });
    inst.canvas.on('mouse:move', function(o) {
      inst.onMouseMove(o);
    });
    inst.canvas.on('mouse:up', function(o) {
      inst.onMouseUp(o);
    });
    inst.canvas.on('object:moving', function(o) {
      inst.disable();
    })
  }

  Ellipse.prototype.unBindEventes = function () {
    var inst = this;
    inst.canvas.off('mouse:down');
    inst.canvas.off('mouse:up');
    inst.canvas.off('mouse:move');
    inst.canvas.off('object:moving');
  }

  Ellipse.prototype.onMouseUp = function(o) {
    var inst = this;
    inst.disable();
    /* inst.unBindEventes(); */
    if (inst.callback) inst.callback();
  };

  Ellipse.prototype.onMouseMove = function(o) {
    var inst = this;
    if (!inst.isEnable()) {
      return;
    }

    var pointer = inst.canvas.getPointer(o.e);
    var activeObj = inst.canvas.getActiveObject();
    activeObj.set({
      rx: Math.abs(activeObj.left - pointer.x)/2,
      ry: Math.abs(activeObj.top - pointer.y)/2, 
      originX: (activeObj.left < pointer.x ? 'left' : 'right'),
      originY: (activeObj.top < pointer.y ? 'top' : 'bottom')
    });
    activeObj.setCoords();
    inst.canvas.renderAll();
  };

  Ellipse.prototype.onMouseDown = function(o) {
    var inst = this;
    inst.enable();
    var pointer = inst.canvas.getPointer(o.e);

    var line = new fabric.InteractiveEllipse({
      strokeWidth: inst.borderSize,
      fill: (inst.color) ? inst.color : 'red',
      stroke: (inst.color) ? inst.color : 'red',
      hasBorders: false,
      hasControls: true,
      selectable: true,
      left: pointer.x,
      top: pointer.y,
    });

    inst.canvas.add(line).setActiveObject(line);
  };

  Ellipse.prototype.isEnable = function() {
    return this.isDrawing;
  }

  Ellipse.prototype.enable = function() {
    this.isDrawing = true;
  }

  Ellipse.prototype.disable = function() {
    this.isDrawing = false;
  }

  return Ellipse;
}());