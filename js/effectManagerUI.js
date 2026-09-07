// effectManagerUI.js
import { effectHandlers } from './effectManager.js';
import { showProgress, hideProgress } from './progressManager.js';
import { saveCanvasState } from './historyManager.js';
import { createOptimizedContext } from './effectManager.js';
import { logger } from './logger.js';
import { canvasPool } from './canvasPool.js';
import { getCurrentShirtCanvas, getAllShirtCanvases, createShirtCanvas } from './shirtCanvasManager.js';
import { sizeScales } from './sizeManager.js';
import { playSound, stopCurrentSound } from './soundManager.js';

let isEffectActive = false;
let currentEffect = null;

export function initEffectManager(tools, drawCanvas, shirtCanvas) {
  document.querySelectorAll('.tool-icon').forEach(el => {
    const effect = el.dataset.effect;
    if (effect) {
      logger.debug(`[${new Date().toISOString()}] Binding effect: ${effect}`);
      el.addEventListener('mousedown', () => {
        logger.info(`[${new Date().toISOString()}] Effect button mousedown: ${effect}`);
        const soundName = effect === 'shred' ? 'shredder' : effect;
        playSound(soundName);
        transferDesignToShirt(effect, drawCanvas, getCurrentShirtCanvas());
      });
      el.addEventListener('mouseup', () => {
        logger.info(`[${new Date().toISOString()}] Effect button mouseup: ${effect}`);
        stopCurrentSound();
        stopEffect(drawCanvas, getCurrentShirtCanvas());
      });
      el.addEventListener('mouseleave', () => {
        logger.info(`[${new Date().toISOString()}] Effect button mouseleave: ${effect}`);
        stopCurrentSound();
        stopEffect(drawCanvas, getCurrentShirtCanvas());
      });
    }
  });
}

export async function transferDesignToShirt(effect, drawCanvas, shirtCanvas) {
  if (!drawCanvas || !shirtCanvas) {
    logger.error(`[${new Date().toISOString()}] Invalid canvas for effect: ${effect}`);
    return;
  }
  if (!effectHandlers[effect]) {
    logger.error(`[${new Date().toISOString()}] Unknown effect: ${effect}`);
    return;
  }
  const shirtCtx = createOptimizedContext(shirtCanvas);
  const progressBar = document.getElementById('effectProgress');
  const shirtCanvases = getAllShirtCanvases();
  const currentStyle = shirtCanvases.currentStyle;

  if (isEffectActive) {
    logger.info(`[${new Date().toISOString()}] Effect ${effect} blocked: another effect is active.`);
    return;
  }

  logger.info(`[${new Date().toISOString()}] Starting effect: ${effect} on ${currentStyle} shirtCanvas`);
  isEffectActive = true;
  currentEffect = effect;
  const maxDuration = effect === 'stamp' ? 500 : effect === 'roll' ? 2000 : effect === 'shred' ? 7000 : effect === 'mixer' ? 5000 : 20000;

  const tempDrawCanvas = canvasPool.getTempCanvas(drawCanvas.width, drawCanvas.height);
  if (!tempDrawCanvas) {
    isEffectActive = false;
    currentEffect = null;
    return;
  }
  const tempDrawCtx = createOptimizedContext(tempDrawCanvas);
  tempDrawCtx.clearRect(0, 0, tempDrawCanvas.width, tempDrawCanvas.height); // Explicitly clear
  tempDrawCtx.drawImage(drawCanvas, 0, 0);
  logger.debug(`[${new Date().toISOString()}] tempDrawCtx created and cleared for effect: ${effect}`);
  const drawData = tempDrawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height).data;
  let drawNonZeroPixels = 0;
  for (let i = 3; i < drawData.length; i += 4) {
    if (drawData[i] !== 0) drawNonZeroPixels++;
  }
  logger.info(`[${new Date().toISOString()}] Draw canvas non-zero pixels: ${drawNonZeroPixels}`);

  if (!shirtCanvases[currentStyle]) {
    logger.info(`[${new Date().toISOString()}] Creating shirt canvas for ${currentStyle} in transferDesign`);
    shirtCanvases[currentStyle] = createShirtCanvas();
    shirtCanvases[currentStyle].shirtCanvas = shirtCanvas;
    shirtCanvases[currentStyle].shirtCtx = shirtCtx;
  }

  const tempCanvas = canvasPool.getTempCanvas();
  if (!tempCanvas) {
    canvasPool.releaseTempCanvas(tempDrawCanvas);
    isEffectActive = false;
    currentEffect = null;
    return;
  }
  const tempCtx = createOptimizedContext(tempCanvas);
  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height); // Explicitly clear

  let isStateSaved = false;

  try {
    await effectHandlers[effect](drawCanvas, tempCtx, 0, maxDuration, (finalProgress) => {
      logger.info(`[${new Date().toISOString()}] Effect ${effect} progress: ${finalProgress * 100}%`);
      showProgress(progressBar, finalProgress);

      const tempData = tempCtx.getImageData(0, 0, 213, 284).data;
      let tempNonZeroPixels = 0;
      for (let i = 3; i < tempData.length; i += 4) {
        if (tempData[i] !== 0) tempNonZeroPixels++;
      }
      logger.info(`[${new Date().toISOString()}] Temp canvas non-zero pixels after effect: ${tempNonZeroPixels}`);

      if (!shirtCanvases[currentStyle].isEmpty) {
        shirtCtx.drawImage(shirtCanvases[currentStyle].originalDesign, 0, 0);
      }
      shirtCtx.drawImage(tempCanvas, 0, 0);

      shirtCanvases[currentStyle].originalDesign.getContext('2d').drawImage(shirtCanvas, 0, 0);
      shirtCanvases[currentStyle].isEmpty = false;

      const styleData = shirtCanvases[currentStyle];
      const scale = sizeScales[styleData.size];
      const scaledWidth = 213 * scale;
      const scaledHeight = 284 * scale;
      const offsetX = (213 - scaledWidth) / 2;
      const offsetY = (284 - scaledHeight) / 2;

      const scaledCanvas = canvasPool.getTempCanvas();
      if (!scaledCanvas) {
        canvasPool.releaseTempCanvas(tempCanvas);
        canvasPool.releaseTempCanvas(tempDrawCanvas);
        return;
      }
      const scaledCtx = createOptimizedContext(scaledCanvas);
      scaledCtx.clearRect(0, 0, scaledCanvas.width, scaledCanvas.height); // Explicitly clear
      scaledCtx.drawImage(shirtCanvas, 0, 0);

      shirtCtx.clearRect(0, 0, 213, 284);
      shirtCtx.drawImage(
        scaledCanvas,
        0, 0, 213, 284,
        offsetX, offsetY, scaledWidth, scaledHeight
      );

      const finalShirtData = shirtCtx.getImageData(0, 0, 213, 284).data;
      let finalShirtNonZeroPixels = 0;
      for (let i = 3; i < finalShirtData.length; i += 4) {
        if (finalShirtData[i] !== 0) finalShirtNonZeroPixels++;
      }
      logger.info(`[${new Date().toISOString()}] Shirt canvas non-zero pixels after scaling: ${finalShirtNonZeroPixels}`);

      if (finalProgress === 1 && !isStateSaved) {
        saveCanvasState(drawCanvas, shirtCanvas, `Transfer Design to Shirt (${effect.charAt(0).toUpperCase() + effect.slice(1)})`, null);
        isStateSaved = true;
        logger.info(`[${new Date().toISOString()}] Effect ${effect} completed with progress: ${finalProgress}`);
        isEffectActive = false;
        currentEffect = null;
        hideProgress(progressBar);
      }

      canvasPool.releaseTempCanvas(scaledCanvas);
    }, () => isEffectActive);
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error applying effect ${effect}:`, error);
    isEffectActive = false;
    currentEffect = null;
    hideProgress(progressBar);
  } finally {
    canvasPool.releaseTempCanvas(tempCanvas);
    canvasPool.releaseTempCanvas(tempDrawCanvas);
  }
}

export function stopEffect(drawCanvas, shirtCanvas) {
  logger.info(`[${new Date().toISOString()}] Stopping effect application`);
  if (isEffectActive && currentEffect !== 'stamp') {
    const tempCanvas = canvasPool.getTempCanvas();
    if (!tempCanvas) {
      isEffectActive = false;
      currentEffect = null;
      return;
    }
    const tempCtx = createOptimizedContext(tempCanvas);
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height); // Explicitly clear
    tempCtx.drawImage(shirtCanvas, 0, 0);
    const tempData = tempCtx.getImageData(0, 0, 213, 284).data;
    let tempNonZeroPixels = 0;
    for (let i = 3; i < tempData.length; i += 4) {
      if (tempData[i] !== 0) tempNonZeroPixels++;
    }
    if (tempNonZeroPixels > 0) {
      saveCanvasState(drawCanvas, shirtCanvas, `Transfer Design to Shirt (${currentEffect.charAt(0).toUpperCase() + currentEffect.slice(1)})`, null);
      logger.info(`[${new Date().toISOString()}] Saved state for ${currentEffect} with ${tempNonZeroPixels} non-zero pixels`);
    }
    canvasPool.releaseTempCanvas(tempCanvas);
  }
  isEffectActive = false;
  currentEffect = null;
}