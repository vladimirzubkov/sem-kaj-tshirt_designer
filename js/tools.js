// tools.js

import { logger } from './logger.js';

// Base class for all tools
export class Tool {
  constructor(ctx, color = '#000000', size = 10) {
    this.ctx = ctx;
    this.color = color;
    this.size = size;
  }

  setColor(color) {
    this.color = color;
    logger.info(`[${new Date().toISOString()}] Tool ${this.constructor.name} color set to ${color}`);
  }

  setSize(size) {
    this.size = size;
    logger.info(`[${new Date().toISOString()}] Tool ${this.constructor.name} size set to ${size}`);
  }

  // Abstract methods to be implemented by subclasses
  onMouseDown(x, y) {
    throw new Error(`onMouseDown not implemented for ${this.constructor.name}`);
  }

  onMouseMove(x, y) {
    // Optional: can be empty for tools like TextTool
  }

  onMouseUp() {
    // Optional: can be empty for tools like TextTool
  }
}

// Base class for line-drawing tools (Pencil, Brush, Eraser)
class DrawingTool extends Tool {
  constructor(ctx, color, size) {
    super(ctx, color, size);
    this.isDrawing = false;
  }

  // Common setup for drawing
  setupContext() {
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
    this.ctx.lineCap = 'round';
  }

  onMouseDown(x, y) {
    logger.debug(`[${new Date().toISOString()}] ${this.constructor.name} drawing started`);
    this.isDrawing = true;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.setupContext();
  }

  onMouseMove(x, y) {
    if (this.isDrawing) {
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }
  }

  onMouseUp() {
    if (this.isDrawing) {
      logger.debug(`[${new Date().toISOString()}] ${this.constructor.name} drawing ended`);
      this.isDrawing = false;
      this.ctx.closePath();
    }
  }
}

export class Pencil extends DrawingTool {
  static name = 'pencil';
  static displayName = 'Pencil';

  constructor(ctx, color = '#000000', size = 10) {
    super(ctx, color, size);
  }
}

export class Brush extends DrawingTool {
  static name = 'brush';
  static displayName = 'Brush';

  constructor(ctx, color = '#000000', size = 10) {
    super(ctx, color, size);
  }
}

export class Eraser extends DrawingTool {
  static name = 'eraser';
  static displayName = 'Eraser';

  constructor(ctx, color = '#ffffff', size = 10) {
    super(ctx, color, size);
  }

  setupContext() {
    this.ctx.strokeStyle = '#ffffff'; // Always white for eraser
    this.ctx.lineWidth = this.size;
    this.ctx.lineCap = 'round';
  }
}

export class Water extends Tool {
  static name = 'water';
  static displayName = 'Water';

  constructor(ctx, size = 10) {
    super(ctx, '#000000', size); // Color is unused
  }

  onMouseDown(x, y) {
    logger.debug(`[${new Date().toISOString()}] Water effect started`);
  }

  onMouseMove(x, y) {
    const r = this.size;
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

  onMouseUp() {
    logger.debug(`[${new Date().toISOString()}] Water effect ended`);
  }
}

export class TextTool extends Tool {
  static name = 'text';
  static displayName = 'Text';

  constructor(ctx, color = '#000000', size = 10) {
    super(ctx, color, size);
  }

  onMouseDown(x, y) {
    const text = prompt('Enter text:');
    logger.info(`[${new Date().toISOString()}] TextTool prompt returned: ${text}`);
    if (text) {
      this.ctx.fillStyle = this.color;
      this.ctx.font = `${this.size}px sans-serif`;
      this.ctx.fillText(text, x, y);
      logger.info(`[${new Date().toISOString()}] TextTool drew text: ${text} at x: ${x}, y: ${y}`);
    }
  }
}