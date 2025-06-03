// sprayEffect.js
import { createOptimizedContext, countNonZeroPixels } from './effectManager.js';
import { logger } from './logger.js';
import { canvasPool } from './canvasPool.js';

export function applySprayEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) {
  const startTime = performance.now();
  const width = targetContext.canvas.width;  // 213
  const height = targetContext.canvas.height; // 284
  const sourceWidth = sourceCanvas.width;  // 375
  const sourceHeight = sourceCanvas.height; // 500
  const scaleX = width / sourceWidth;
  const scaleY = height / sourceHeight;

  // Create temporary canvas for source
  const tempSourceCanvas = canvasPool.getTempCanvas(sourceWidth, sourceHeight);
  if (!tempSourceCanvas) return;
  const tempSourceCtx = createOptimizedContext(tempSourceCanvas);
  tempSourceCtx.drawImage(sourceCanvas, 0, 0);

  const sourceNonZeroPixels = countNonZeroPixels(tempSourceCtx, sourceWidth, sourceHeight);
  logger.info(`[${new Date().toISOString()}] Spray: Non-zero pixels on sourceCanvas: ${sourceNonZeroPixels}`);

  logger.info(`[${new Date().toISOString()}] Spray effect started`);

  const sourceData = tempSourceCtx.getImageData(0, 0, sourceWidth, sourceHeight).data;
  const dropletsPerFrame = 25;
  const totalFrames = 200;
  const totalTargetDroplets = dropletsPerFrame * totalFrames;

  let totalDroplets = 0;

  // Function to apply a single frame of droplets
  const applyFrame = () => {
    const dropletsThisFrame = Math.min(dropletsPerFrame, totalTargetDroplets - totalDroplets);
    totalDroplets += dropletsThisFrame;

    logger.info(`[${new Date().toISOString()}] Spray frame: Applying ${dropletsThisFrame} droplets, total: ${totalDroplets}`);

    for (let i = 0; i < dropletsThisFrame; i++) {
      // Generate coordinates in target canvas space (213x284)
      const x = Math.random() * width;
      const y = Math.random() * height;
      // Convert to source canvas space (375x500)
      const srcX = x / scaleX;
      const srcY = y / scaleY;
      const srcXClamped = Math.max(0, Math.min(sourceWidth - 1, Math.round(srcX)));
      const srcYClamped = Math.max(0, Math.min(sourceHeight - 1, Math.round(srcY)));
      const srcIdx = (srcYClamped * sourceWidth + srcXClamped) * 4;

      if (sourceData[srcIdx + 3] > 0) {
        const radius = Math.random() * 4 + 1;
        targetContext.fillStyle = `rgba(${sourceData[srcIdx]}, ${sourceData[srcIdx + 1]}, ${sourceData[srcIdx + 2]}, 1)`;
        targetContext.beginPath();
        targetContext.arc(x, y, radius, 0, Math.PI * 2);
        targetContext.fill();
      }
    }

    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / maxDuration, 1);
    logger.info(`[${new Date().toISOString()}] Spray progress: ${progress * 100}%`);
    callback(progress);

    const nonZeroPixels = countNonZeroPixels(targetContext, width, height);
    logger.info(`[${new Date().toISOString()}] Spray: Non-zero pixels on shirtCanvas: ${nonZeroPixels}`);
  };

  // Apply frames while the button is pressed
  const drawSpray = () => {
    if (isEffectActive()) {
      applyFrame();
      setTimeout(drawSpray, 100);
    } else {
      logger.info(`[${new Date().toISOString()}] Spray effect stopped by user`);
    }
  };

  drawSpray();
  canvasPool.releaseTempCanvas(tempSourceCanvas);
}