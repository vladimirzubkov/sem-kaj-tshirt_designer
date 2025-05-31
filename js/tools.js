// js/tools.js

export class Tool {
  constructor(ctx, color = '#000000', size = 10) {
    this.ctx = ctx;
    this.color = color;
    this.size = size; // Default size
  }
  setColor(color) {
    this.color = color;
  }
  setSize(size) {
    this.size = size; // Update size dynamically
  }
  onMouseDown(e) {}
  onMouseMove(e) {}
  onMouseUp(e) {}
}

export class Pencil extends Tool {
  onMouseDown(e) {
    this.ctx.beginPath();
    this.ctx.moveTo(e.offsetX, e.offsetY);
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size; // Use dynamic size
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
  onMouseDown(e) {
    this.ctx.beginPath();
    this.ctx.moveTo(e.offsetX, e.offsetY);
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size; // Use dynamic size
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
  onMouseDown(e) {
    this.ctx.beginPath();
    this.ctx.moveTo(e.offsetX, e.offsetY);
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = this.size; // Use dynamic size
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
  onMouseMove(e) {
    const r = this.size; // Use dynamic size as radius
    const x = e.offsetX;
    const y = e.offsetY;

    // Crop a square region around cursor
    const img = this.ctx.getImageData(x - r, y - r, 2 * r, 2 * r);

    // Create temporary canvas to blur
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 2 * r;
    tempCanvas.height = 2 * r;
    const tempCtx = tempCanvas.getContext('2d');

    // Put the image data, blur, then draw back
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
  onMouseDown(e) {
    const text = prompt('Enter text:');
    if (text) {
      this.ctx.fillStyle = this.color;
      this.ctx.font = `${this.size}px sans-serif`; // Use dynamic size for font
      this.ctx.fillText(text, e.offsetX, e.offsetY);
    }
  }
}