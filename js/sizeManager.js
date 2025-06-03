// sizeManager.js
import { saveCanvasState } from './historyManager.js';
import { createOptimizedContext } from './effectManager.js';
import { logger } from './logger.js';
import { canvasPool } from './canvasPool.js';
import { getAllShirtCanvases } from './shirtCanvasManager.js';

export const sizeScales = {
  xxl: 1.2,
  xl: 1.1,
  l: 1,
  m: 0.9,
  s: 0.8
};

export function initSizeManager(tools, drawCanvas, domElements) {
  // Size buttons already bound in uiManager.js
}

export function applySizeScaling(size, drawCanvas) {
  const shirtCanvases = getAllShirtCanvases();
  const currentStyle = shirtCanvases.currentStyle;
  logger.info(`[${new Date().toISOString()}] Applying size: ${size}`);
  
  const styleData = shirtCanvases[currentStyle] || { 
    shirtCanvas: document.getElementById('shirtCanvas'), 
    shirtCtx: createOptimizedContext(document.getElementById('shirtCanvas')), 
    size: 'l', 
    isEmpty: true, 
    originalDesign: document.createElement('canvas'),
    shirtColor: '#ffffff',
    backgroundColor: 'transparent'
  };
  
  styleData.size = size;

  document.querySelectorAll('.size-button').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.size === size);
  });

  if (!styleData.isEmpty) {
    logger.info(`[${new Date().toISOString()}] Rescaling shirt canvas for size: ${size}`);
    const tempCanvas = canvasPool.getTempCanvas();
    if (!tempCanvas) return;
    const tempCtx = createOptimizedContext(tempCanvas);
    tempCtx.drawImage(styleData.originalDesign, 0, 0);

    styleData.shirtCtx.clearRect(0, 0, 213, 284);
    const scale = sizeScales[size];
    const scaledWidth = 213 * scale;
    const scaledHeight = 284 * scale;
    const offsetX = (213 - scaledWidth) / 2;
    const offsetY = (284 - scaledHeight) / 2;
    styleData.shirtCtx.drawImage(
      tempCanvas,
      0, 0, 213, 284,
      offsetX, offsetY, scaledWidth, scaledHeight
    );

    const scaledData = styleData.shirtCtx.getImageData(0, 0, 213, 284).data;
    let scaledNonZeroPixels = 0;
    for (let i = 3; i < scaledData.length; i += 4) {
      if (scaledData[i] !== 0) scaledNonZeroPixels++;
    }
    logger.info(`[${new Date().toISOString()}] Shirt canvas non-zero pixels after scaling: ${scaledNonZeroPixels}`);

    canvasPool.releaseTempCanvas(tempCanvas);
  }

  saveCanvasState(drawCanvas, styleData.shirtCanvas, `Change Size (${size.toUpperCase()})`, null);
}