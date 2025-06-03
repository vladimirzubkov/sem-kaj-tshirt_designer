// stampEffect.js
import { createOptimizedContext, countNonZeroPixels } from './effectManager.js';
import { logger } from './logger.js';

/**
 * Applies the stamp effect by copying the source canvas to the target context.
 * @param {CanvasRenderingContext2D} targetContext - Target canvas context.
 * @param {HTMLCanvasElement} sourceCanvas - Source canvas with the design.
 * @param {HTMLCanvasElement} targetCanvas - Target canvas for the effect.
 * @param {Function} callback - Callback to report progress.
 */
export async function applyStampEffect(targetContext, sourceCanvas, targetCanvas, callback) {
  if (!sourceCanvas || !sourceCanvas.getContext) {
    logger.error(`[${new Date().toISOString()}] Stamp: Invalid source canvas`);
    return;
  }
  if (!targetContext || !targetContext.canvas) {
    logger.error(`[${new Date().toISOString()}] Stamp: Invalid target context`);
    return;
  }
  if (!targetCanvas || !targetCanvas.getContext) {
    logger.error(`[${new Date().toISOString()}] Stamp: Invalid target canvas`);
    return;
  }
  if (typeof callback !== 'function') {
    logger.warn(`[${new Date().toISOString()}] Stamp: Callback is not a function`);
  }

  const width = targetCanvas.width;
  const height = targetCanvas.height;

  // Count non-zero pixels on source canvas
  const sourceCtx = createOptimizedContext(sourceCanvas);
  const sourceNonZeroPixels = countNonZeroPixels(sourceCtx, sourceCanvas.width, sourceCanvas.height);
  logger.info(`[${new Date().toISOString()}] Stamp: Non-zero pixels on drawCanvas: ${sourceNonZeroPixels}`);

  // Apply stamp effect
  targetContext.drawImage(sourceCanvas, 0, 0, width, height);
  logger.info(`[${new Date().toISOString()}] Stamp effect applied: Added image to shirtCanvas`);

  // Count non-zero pixels on target canvas
  const targetNonZeroPixels = countNonZeroPixels(targetContext, targetCanvas.width, targetCanvas.height);
  logger.info(`[${new Date().toISOString()}] Stamp: Non-zero pixels on shirtCanvas: ${targetNonZeroPixels}`);

  // Update progress
  if (typeof callback === 'function') {
    callback(1);
  }
}