// mixerEffect.js
import { createOptimizedContext, countNonZeroPixels, isCanvasEmpty } from './effectManager.js';
import { logger } from './logger.js';
import { canvasPool } from './canvasPool.js';

export async function applyMixerEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) {
  const startTime = performance.now();
  const width = targetContext.canvas.width;  // 213
  const height = targetContext.canvas.height; // 284
  const centers = [];
  const maxCenters = 5;
  const maxRadius = height * 2 / 3;
  const radiusLevels = [1, 0.5, 0.333, 0.25, 0.2];
  const mergeAngles = [0, (72 * Math.PI / 180), (144 * Math.PI / 180), (216 * Math.PI / 180), (288 * Math.PI / 180)];
  const distortionLimit = height * 0.05;
  const gridSize = 10;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  // Create temporary canvas for source
  const tempSourceCanvas = canvasPool.getTempCanvas(sourceCanvas.width, sourceCanvas.height);
  if (!tempSourceCanvas) return;
  const tempSourceCtx = createOptimizedContext(tempSourceCanvas);
  tempSourceCtx.drawImage(sourceCanvas, 0, 0);

  const sourceNonZeroPixels = countNonZeroPixels(tempSourceCtx, sourceCanvas.width, sourceCanvas.height);
  logger.info(`[${new Date().toISOString()}] Mixer: Non-zero pixels on sourceCanvas: ${sourceNonZeroPixels}`);

  // Check if shirtCanvas is empty; if so, copy the source image
  if (isCanvasEmpty(targetContext, width, height)) {
    logger.info(`[${new Date().toISOString()}] Mixer: shirtCanvas is empty, copying source image`);
    targetContext.drawImage(sourceCanvas, 0, 0, width, height);
  }

  logger.info(`[${new Date().toISOString()}] Mixer effect started`);

  // Select warp type randomly once at the start
  const warpTypes = ['merge', 'twistCW', 'twistCCW', 'inflate', 'deflate', 'gridWarp'];
  const selectedWarpType = warpTypes[Math.floor(Math.random() * warpTypes.length)];
  logger.info(`[${new Date().toISOString()}] Mixer: Selected warp type: ${selectedWarpType}`);

  // Apply up to 5 warps
  for (let i = 0; i < maxCenters; i++) {
    if (!isEffectActive()) {
      logger.info(`[${new Date().toISOString()}] Mixer effect stopped at warp ${i + 1}`);
      break;
    }

    logger.info(`[${new Date().toISOString()}] Mixer adding warp ${i + 1}`);

    if (selectedWarpType === 'gridWarp') {
      // Apply grid-based warp
      const tempCanvas = canvasPool.getTempCanvas();
      if (!tempCanvas) {
        canvasPool.releaseTempCanvas(tempSourceCanvas);
        return;
      }
      const tempCtx = createOptimizedContext(tempCanvas);
      tempCtx.drawImage(targetContext.canvas, 0, 0);

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
      const warped = new Uint8ClampedArray(data.length);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const gridX = Math.floor(x / cellWidth);
          const gridY = Math.floor(y / cellHeight);
          const offset = offsets[gridY * gridSize + gridX];
          const srcX = Math.min(width - 1, Math.max(0, Math.round(x + offset.x)));
          const srcY = Math.min(height - 1, Math.max(0, Math.round(y + offset.y)));
          const srcIdx = (srcY * width + srcX) * 4;
          const dstIdx = (y * width + x) * 4;
          warped[dstIdx] = data[srcIdx];
          warped[dstIdx + 1] = data[srcIdx + 1];
          warped[dstIdx + 2] = data[srcIdx + 2];
          warped[dstIdx + 3] = data[srcIdx + 3];
        }
      }

      targetContext.putImageData(new ImageData(warped, width, height), 0, 0);
      canvasPool.releaseTempCanvas(tempCanvas);
    } else {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      centers.push({
        x: cx,
        y: cy,
        type: selectedWarpType,
        applied: false,
        mergePoint: mergeAngles[i % mergeAngles.length]
      });

      const center = centers[centers.length - 1];
      const currentRadius = maxRadius * (1 - i / maxCenters);
      const imageData = targetContext.getImageData(0, 0, width, height);
      const data = imageData.data;
      const warped = new Uint8ClampedArray(data.length);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let dx = 0, dy = 0;
          for (let level = 1; level <= radiusLevels.length; level++) {
            const dx_ = x - center.x;
            const dy_ = y - center.y;
            const dist = Math.sqrt(dx_ * dx_ + dy_ * dy_);
            if (dist <= currentRadius * radiusLevels[level - 1] && dist > 0 && !center.applied) {
              const radiusAtLevel = currentRadius * radiusLevels[level - 1];
              const ratio = dist / radiusAtLevel;
              const strength = 1 - ratio;

              if (center.type === 'merge') {
                const mergeX = cx + Math.cos(center.mergePoint) * radiusAtLevel;
                const mergeY = cy + Math.sin(center.mergePoint) * radiusAtLevel;
                const pullX = (mergeX - x) * strength;
                const pullY = (mergeY - y) * strength;
                dx += pullX;
                dy += pullY;
              } else if (center.type === 'twistCW' || center.type === 'twistCCW') {
                const direction = center.type === 'twistCW' ? 1 : -1;
                const angle = (5 * level * Math.PI / 180) * direction * strength;
                dx += Math.cos(angle) * dx_ - Math.sin(angle) * dy_ - dx_;
                dy += Math.sin(angle) * dx_ + Math.cos(angle) * dy_ - dy_;
              } else if (center.type === 'inflate') {
                const factor = 1 + strength * 0.5 * (1 - (level - 1) / radiusLevels.length);
                dx += dx_ * factor - dx_;
                dy += dy_ * factor - dy_;
              } else if (center.type === 'deflate') {
                const factor = 1 - strength * 0.5 * (1 - (level - 1) / radiusLevels.length);
                dx += dx_ * factor - dx_;
                dy += dy_ * factor - dy_;
              }
            }
          }

          const srcX = Math.min(width - 1, Math.max(0, Math.round(x + dx)));
          const srcY = Math.min(height - 1, Math.max(0, Math.round(y + dy)));
          const srcIdx = (srcY * width + srcX) * 4;
          const dstIdx = (y * width + x) * 4;
          warped[dstIdx] = data[srcIdx];
          warped[dstIdx + 1] = data[srcIdx + 1];
          warped[dstIdx + 2] = data[srcIdx + 2];
          warped[dstIdx + 3] = data[srcIdx + 3];
        }
      }

      center.applied = true;
      targetContext.putImageData(new ImageData(warped, width, height), 0, 0);
    }

    // Update progress bar
    const progress = (i + 1) / maxCenters;
    logger.info(`[${new Date().toISOString()}] Mixer progress: ${progress * 100}%`);
    callback(progress);

    // Log shirtCanvas content
    const nonZeroPixels = countNonZeroPixels(targetContext, width, height);
    logger.info(`[${new Date().toISOString()}] Mixer: Non-zero pixels on shirtCanvas after warp ${i + 1}: ${nonZeroPixels}`);

    // Wait 1 second before the next warp
    if (i < maxCenters - 1) {
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 1000);
        if (!isEffectActive()) {
          clearTimeout(timeout);
          resolve();
        }
      });
    }
  }

  canvasPool.releaseTempCanvas(tempSourceCanvas);
}