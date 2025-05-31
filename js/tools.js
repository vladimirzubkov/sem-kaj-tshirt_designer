// js/tools.js

export class Tool {
  constructor(ctx, color = '#000000', size = 10) {
    this.ctx = ctx;
    this.color = color;
    this.size = size;
  }
  setColor(color) {
    this.color = color;
  }
  setSize(size) {
    this.size = size;
  }
  onMouseDown(e) {}
  onMouseMove(e) {}
  onMouseUp(e) {}
}

export class Pencil extends Tool {
  static name = 'pencil'; // Unique name
  static displayName = 'Pencil'; // Display name for UI
  onMouseDown(e) {
    this.ctx.beginPath();
    this.ctx.moveTo(e.offsetX, e.offsetY);
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    this.ctx.lineCap = 'round';
  }
  onMouseMove(e) {
    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.stroke();
  }
  onMouseUp() {
    this.ctx.closePath();
  }
}

export class Brush extends Tool {
  static name = 'brush';
  static displayName = 'Brush';
  onMouseDown(e) {
    this.ctx.beginPath();
    this.ctx.moveTo(e.offsetX, e.offsetY);
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    this.ctx.lineCap = 'round';
  }
  onMouseMove(e) {
    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.stroke();
  }
  onMouseUp() {
    this.ctx.closePath();
  }
}

export class Eraser extends Tool {
  static name = 'eraser';
  static displayName = 'Eraser';
  onMouseDown(e) {
    this.ctx.beginPath();
    this.ctx.moveTo(e.offsetX, e.offsetY);
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = this.size;
    this.ctx.lineCap = 'round';
  }
  onMouseMove(e) {
    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.stroke();
  }
  onMouseUp() {
    this.ctx.closePath();
  }
}

export class Water extends Tool {
  static name = 'water';
  static displayName = 'Water';
  onMouseMove(e) {
    const r = this.size;
    const x = e.offsetX;
    const y = e.offsetY;

    const img = this.ctx.getImageData(x - r, y - r, 2 * r, 2 * r);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 2 * r;
    tempCanvas.height = 2 * r;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(img, 0, 0);

    this.ctx.save();
    this.ctx.globalAlpha = 0.6;
    this.ctx.filter = 'blur(2px)';
    this.ctx.drawImage(tempCanvas, 0, 0, 2 * r, 2 * r, x - r, y - r, 2 * r, 2 * r);
    this.ctx.restore();
  }

  onMouseDown(e) {}
  onMouseUp(e) {}
}

export class TextTool extends Tool {
  static name = 'text';
  static displayName = 'Text';
  onMouseDown(e) {
    const text = prompt('Enter text:');
    if (text) {
      this.ctx.fillStyle = this.color;
      this.ctx.font = `${this.size}px sans-serif`;
      this.ctx.fillText(text, e.offsetX, e.offsetY);
    }
  }
}