// shredderEffect.js
import { createOptimizedContext, countNonZeroPixels, isCanvasEmpty } from './effectManager.js';
import { logger } from './logger.js';
import { canvasPool } from './canvasPool.js';

export async function applyShredderEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) {
  const startTime = performance.now();
  const width = targetContext.canvas.width;  // 213
  const height = targetContext.canvas.height; // 284
  let pieces = [];
  const maxOffset = height / 3; // 1/3 of height (284 / 3 ≈ 94px)
  const maxSteps = 7; // 7 steps over 7 seconds

  // Create temporary canvas for source
  const tempSourceCanvas = canvasPool.getTempCanvas(sourceCanvas.width, sourceCanvas.height);
  if (!tempSourceCanvas) return;
  const tempSourceCtx = createOptimizedContext(tempSourceCanvas);
  tempSourceCtx.drawImage(sourceCanvas, 0, 0);

  const sourceNonZeroPixels = countNonZeroPixels(tempSourceCtx, sourceCanvas.width, sourceCanvas.height);
  logger.info(`[${new Date().toISOString()}] Shredder: Non-zero pixels on sourceCanvas: ${sourceNonZeroPixels}`);

  // Check if shirtCanvas is empty; if so, copy the source image
  if (isCanvasEmpty(targetContext, width, height)) {
    logger.info(`[${new Date().toISOString()}] Shredder: shirtCanvas is empty, copying source image`);
    targetContext.drawImage(sourceCanvas, 0, 0, width, height);
  }

  logger.info(`[${new Date().toISOString()}] Shredder effect started`);

  // Initial pieces: 5x5 grid
  if (pieces.length === 0) {
    const pieceWidth = width / 5;
    const pieceHeight = height / 5;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        pieces.push({
          srcX: x * pieceWidth,
          srcY: y * pieceHeight,
          width: pieceWidth,
          height: pieceHeight,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          shapeDistortion: []
        });
      }
    }
  }

  // Apply 7 shredding steps
  for (let step = 0; step < maxSteps; step++) {
    logger.info(`[${new Date().toISOString()}] Shredder step ${step + 1}: Subdividing pieces`);
    const currentOffset = maxOffset * (step + 1) / maxSteps;
    const newPieces = [];
    const subShredX = Math.ceil((step + 5) / 5);
    const subShredY = Math.ceil((step + 5) / 5);

    // Subdivide each piece
    pieces.forEach(piece => {
      const subWidth = piece.width / subShredX;
      const subHeight = piece.height / subShredY;

      for (let sy = 0; sy < subShredY; sy++) {
        for (let sx = 0; sx < subShredX; sx++) {
          const newOffsetX = piece.offsetX + (Math.random() - 0.5) * currentOffset;
          const newOffsetY = piece.offsetY + (Math.random() - 0.5) * currentOffset;
          const rotation = (Math.random() * 10 + 5) * (Math.random() > 0.5 ? 1 : -1);
          const shapeDistortion = [
            { dx: (Math.random() - 0.5) * subWidth * 0.2, dy: (Math.random() - 0.5) * subHeight * 0.2 },
            { dx: (Math.random() - 0.5) * subWidth * 0.2, dy: (Math.random() - 0.5) * subHeight * 0.2 },
            { dx: (Math.random() - 0.5) * subWidth * 0.2, dy: (Math.random() - 0.5) * subHeight * 0.2 },
            { dx: (Math.random() - 0.5) * subWidth * 0.2, dy: (Math.random() - 0.5) * subHeight * 0.2 }
          ];

          newPieces.push({
            srcX: piece.srcX + sx * subWidth,
            srcY: piece.srcY + sy * subHeight,
            width: subWidth,
            height: subHeight,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
            rotation: rotation,
            shapeDistortion: shapeDistortion
          });
        }
      }
    });

    pieces = newPieces;

    // Draw the accumulated pieces
    const tempCanvas = canvasPool.getTempCanvas();
    if (!tempCanvas) {
      canvasPool.releaseTempCanvas(tempSourceCanvas);
      return;
    }
    const tempCtx = createOptimizedContext(tempCanvas);
    tempCtx.drawImage(targetContext.canvas, 0, 0);

    targetContext.clearRect(0, 0, width, height);
    pieces.forEach(piece => {
      targetContext.save();
      targetContext.translate(
          piece.srcX + piece.width / 2 + piece.offsetX,
          piece.srcY + piece.height / 2 + piece.offsetY
      );
      targetContext.rotate(piece.rotation * Math.PI / 180);

      targetContext.beginPath();
      targetContext.moveTo(
          -piece.width / 2 + piece.shapeDistortion[0].dx,
          -piece.height / 2 + piece.shapeDistortion[0].dy
      );
      targetContext.lineTo(
          piece.width / 2 + piece.shapeDistortion[1].dx,
          -piece.height / 2 + piece.shapeDistortion[1].dy
      );
      targetContext.lineTo(
          piece.width / 2 + piece.shapeDistortion[2].dx,
          piece.height / 2 + piece.shapeDistortion[2].dy
      );
      targetContext.lineTo(
          -piece.width / 2 + piece.shapeDistortion[3].dx,
          piece.height / 2 + piece.shapeDistortion[3].dy
      );
      targetContext.closePath();
      targetContext.clip();

      targetContext.drawImage(
          tempCanvas,
          piece.srcX, piece.srcY, piece.width, piece.height,
          -piece.width / 2, -piece.height / 2, piece.width, piece.height
      );

      targetContext.restore();
    });

    // Verify content after drawing
    const tempData = targetContext.getImageData(0, 0, width, height).data;
    let tempNonZeroPixels = 0;
    for (let i = 3; i < tempData.length; i += 4) {
      if (tempData[i] !== 0) tempNonZeroPixels++;
    }
    if (tempNonZeroPixels === 0 && step > 0) {
      logger.warn(`[${new Date().toISOString()}] Shredder: No pixels after step ${step + 1}, restoring previous state`);
      targetContext.drawImage(tempCanvas, 0, 0);
    }

    // Update progress bar
    const progress = (step + 1) / maxSteps;
    logger.info(`[${new Date().toISOString()}] Shredder progress: ${progress * 100}%`);
    callback(progress);

    // Log shirtCanvas content
    const nonZeroPixels = countNonZeroPixels(targetContext, width, height);
    logger.info(`[${new Date().toISOString()}] Shredder: Non-zero pixels on shirtCanvas after step ${step + 1}: ${nonZeroPixels}`);

    // Signal completion on the final step
    if (step === maxSteps - 1) {
      callback(1);
    }

    canvasPool.releaseTempCanvas(tempCanvas);

    // Wait 1 second before the next step
    if (step < maxSteps - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!isEffectActive()) {
        logger.info(`[${new Date().toISOString()}] Shredder effect stopped at step ${step + 1}`);
        break;
      }
    }
  }

  canvasPool.releaseTempCanvas(tempSourceCanvas);
}