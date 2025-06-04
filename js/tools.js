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
    this.lastX = 0;
    this.lastY = 0;
  }

  // Common setup for drawing
  setupContext() {
    this.ctx.lineWidth = this.size;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  onMouseDown(x, y) {
    logger.debug(`[${new Date().toISOString()}] ${this.constructor.name} drawing started`);
    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;
    this.setupContext();
    // Draw initial point to avoid sharp corners
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.size / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  onMouseMove(x, y) {
    if (this.isDrawing) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      // Draw circle at current point for smooth ends
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.lastX = x;
      this.lastY = y;
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

  constructor(ctx, color = '#1C2526', size = 10) {
    super(ctx, color, size);
  }

  setupContext() {
    super.setupContext();
    this.ctx.strokeStyle = this.color;
    this.ctx.fillStyle = this.color;
    this.ctx.globalAlpha = 1;
    this.ctx.filter = 'none';
    this.ctx.globalCompositeOperation = 'source-over';
  }
}

export class Brush extends DrawingTool {
  static name = 'brush';
  static displayName = 'Brush';

  constructor(ctx, color = '#E21212', size = 35) {
    super(ctx, color, size);
  }

  setupContext() {
    super.setupContext();
    this.ctx.strokeStyle = this.color;
    this.ctx.fillStyle = this.color;
    this.ctx.globalAlpha = 0.5; // 50% transparency for softer effect
    this.ctx.filter = 'blur(4px)'; // Slightly stronger blur for smooth edges
    this.ctx.globalCompositeOperation = 'source-over'; // Standard blending
  }

  onMouseUp() {
    super.onMouseUp();
    this.ctx.globalAlpha = 1; // Restore default
    this.ctx.filter = 'none'; // Remove blur
  }
}

export class Eraser extends DrawingTool {
  static name = 'eraser';
  static displayName = 'Eraser';

  constructor(ctx, color = '#000000', size = 50) {
    super(ctx, color, size); // Color is unused
  }

  setupContext() {
    super.setupContext();
    this.ctx.globalCompositeOperation = 'destination-out'; // Erase to transparent
    this.ctx.strokeStyle = 'rgba(0,0,0,1)';
    this.ctx.fillStyle = 'rgba(0,0,0,1)';
    this.ctx.globalAlpha = 1;
    this.ctx.filter = 'none';
  }

  onMouseUp() {
    super.onMouseUp();
    this.ctx.globalCompositeOperation = 'source-over'; // Restore default
  }
}

export class Water extends Tool {
  static name = 'water';
  static displayName = 'Water';

  constructor(ctx, size = 50) {
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

  constructor(ctx, color = '#000000', size = 50) {
    super(ctx, color, size);
  }

  onMouseDown(x, y) {
    const text = prompt('Enter text:');
    logger.info(`[${new Date().toISOString()}] TextTool prompt returned: ${text}`);
    if (text) {
      this.ctx.save();
      this.ctx.fillStyle = this.color;
      this.ctx.font = `${this.size}px sans-serif`;
      this.ctx.filter = 'none'; // Explicitly disable blur
      this.ctx.fillText(text, x, y);
      this.ctx.restore();
      logger.info(`[${new Date().toISOString()}] TextTool drew text: ${text} at x: ${x}, y: ${y}`);
    }
  }
}