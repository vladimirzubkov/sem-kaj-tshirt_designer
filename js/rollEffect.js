// rollEffect.js
import { createOptimizedContext, countNonZeroPixels } from './effectManager.js';
import { logger } from './logger.js';
import { canvasPool } from './canvasPool.js';

export function applyRollEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) {
  const startTime = performance.now();
  const width = targetContext.canvas.width;  // 213
  const height = targetContext.canvas.height; // 284
  const distortionLimit = height * 0.02; // 2% of canvas height (284 * 0.02 = 5.68px)
  const gridSize = 10;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  // Create temporary canvas for source
  const tempSourceCanvas = canvasPool.getTempCanvas(sourceCanvas.width, sourceCanvas.height);
  if (!tempSourceCanvas) return;
  const tempSourceCtx = createOptimizedContext(tempSourceCanvas);
  tempSourceCtx.drawImage(sourceCanvas, 0, 0);

  const sourceNonZeroPixels = countNonZeroPixels(tempSourceCtx, sourceCanvas.width, sourceCanvas.height);
  logger.info(`[${new Date().toISOString()}] Roll: Non-zero pixels on sourceCanvas: ${sourceNonZeroPixels}`);

  logger.info(`[${new Date().toISOString()}] Roll effect started`);

  // Create a temporary canvas for distortion
  const tempCanvas = canvasPool.getTempCanvas();
  if (!tempCanvas) {
    canvasPool.releaseTempCanvas(tempSourceCanvas);
    return;
  }
  const tempCtx = createOptimizedContext(tempCanvas);

  // Function to apply a single distortion pass
  const applyDistortionPass = (alpha) => {
    tempCtx.clearRect(0, 0, width, height);
    tempCtx.drawImage(sourceCanvas, 0, 0, width, height);

    const offsets = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        offsets.push({
          x: (Math.random() - 0.5) * distortionLimit,
          y: (Math.random() - 0.5) * distortionLimit
        });
      }
    }

    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const distorted = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gridX = Math.floor(x / cellWidth);
        const gridY = Math.floor(y / cellHeight);
        const offset = offsets[gridY * gridSize + gridX];
        const srcX = Math.min(width - 1, Math.max(0, Math.round(x + offset.x)));
        const srcY = Math.min(height - 1, Math.max(0, Math.round(y + offset.y)));
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * width + x) * 4;
        distorted[dstIdx] = data[srcIdx];
        distorted[dstIdx + 1] = data[srcIdx + 1];
        distorted[dstIdx + 2] = data[srcIdx + 2];
        distorted[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    tempCtx.putImageData(new ImageData(distorted, width, height), 0, 0);

    targetContext.globalAlpha = alpha;
    targetContext.drawImage(tempCanvas, 0, 0);
    targetContext.globalAlpha = 1.0;
  };

  let firstPassDone = false;
  let secondPassDone = false;

  const applyDistortions = () => {
    if (!isEffectActive()) {
      logger.info(`[${new Date().toISOString()}] Roll effect stopped by user`);
      canvasPool.releaseTempCanvas(tempCanvas);
      canvasPool.releaseTempCanvas(tempSourceCanvas);
      return;
    }

    if (!firstPassDone) {
      logger.info(`[${new Date().toISOString()}] Roll first pass: Applying distortion with 50% transparency`);
      applyDistortionPass(0.5);
      firstPassDone = true;
      callback(0.5);
      logger.info(`[${new Date().toISOString()}] Roll progress: 50%`);
    }

    if (firstPassDone && !secondPassDone) {
      setTimeout(() => {
        if (isEffectActive()) {
          logger.info(`[${new Date().toISOString()}] Roll second pass: Applying distortion with 50% transparency`);
          applyDistortionPass(0.5);
          secondPassDone = true;
          callback(1);
          logger.info(`[${new Date().toISOString()}] Roll progress: 100%`);

          const nonZeroPixels = countNonZeroPixels(targetContext, width, height);
          logger.info(`[${new Date().toISOString()}] Roll: Non-zero pixels on shirtCanvas: ${nonZeroPixels}`);

          canvasPool.releaseTempCanvas(tempCanvas);
          canvasPool.releaseTempCanvas(tempSourceCanvas);
        } else {
          logger.info(`[${new Date().toISOString()}] Roll effect stopped before second pass`);
          canvasPool.releaseTempCanvas(tempCanvas);
          canvasPool.releaseTempCanvas(tempSourceCanvas);
        }
      }, 1000);
    }
  };

  applyDistortions();
}