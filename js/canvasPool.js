// canvasPool.js
import { createOptimizedContext } from './effectManager.js';
import { logger } from './logger.js';

export const canvasPool = {
  available: [],
  inUse: new Set(),
  maxSize: 10,

  getTempCanvas(width = 213, height = 284) {
    let canvas = this.available.find(c => c.width === width && c.height === height);
    if (!canvas && this.available.length + this.inUse.size < this.maxSize) {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      logger.debug(`[${new Date().toISOString()}] Created new canvas for pool: ${width}x${height}`);
    }
    if (canvas) {
      this.inUse.add(canvas);
      this.available = this.available.filter(c => c !== canvas);
      const ctx = createOptimizedContext(canvas);
      ctx.clearRect(0, 0, width, height);
      return canvas;
    }
    logger.error(`[${new Date().toISOString()}] No available canvas in pool for ${width}x${height}`);
    return null;
  },

  releaseTempCanvas(canvas) {
    if (this.inUse.has(canvas)) {
      this.inUse.delete(canvas);
      this.available.push(canvas);
      logger.debug(`[${new Date().toISOString()}] Released canvas to pool: ${canvas.width}x${canvas.height}`);
    }
  }
};