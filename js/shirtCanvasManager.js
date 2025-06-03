// shirtCanvasManager.js
import { saveCanvasState } from './historyManager.js';
import { createOptimizedContext } from './effectManager.js';
import { logger } from './logger.js';
import { updateBackgroundColorOptions, updateShirtColorOptions } from './colorManager.js';

let shirtCanvases = {
  man: createShirtCanvas(), // Initialize man style by default
  woman: null,
  kid: null
};
export let currentStyle = 'man';

const styleBackgrounds = {
  man: 'assets/tshirt-placeholder-man.png',
  woman: 'assets/tshirt-placeholder-woman.png',
  kid: 'assets/tshirt-placeholder-kid.png'
};

export function switchStyle(newStyle, drawCanvas, initialShirtCanvas) {
  if (newStyle === currentStyle) {
    logger.debug(`[${new Date().toISOString()}] Skipping switchStyle: already on ${newStyle}`);
    return;
  }

  logger.info(`[${new Date().toISOString()}] Switching to style: ${newStyle}`);

  // Save current state before switching
  const previousShirtCanvas = shirtCanvases[currentStyle]?.shirtCanvas || initialShirtCanvas;
  saveCanvasState(drawCanvas, previousShirtCanvas, `Switch Style (${currentStyle})`, null);

  // Create new shirt canvas if it doesn't exist
  if (!shirtCanvases[newStyle]) {
    logger.info(`[${new Date().toISOString()}] Creating new shirt canvas for: ${newStyle}`);
    shirtCanvases[newStyle] = createShirtCanvas();
  }

  // Copy design from previous style if it has content
  if (shirtCanvases[newStyle].isEmpty) {
    const previousCtx = createOptimizedContext(previousShirtCanvas);
    const previousData = previousCtx.getImageData(0, 0, 213, 284).data;
    let hasContent = false;
    for (let i = 3; i < previousData.length; i += 4) {
      if (previousData[i] !== 0) {
        hasContent = true;
        break;
      }
    }
    if (hasContent) {
      logger.info(`[${new Date().toISOString()}] Copying design from ${currentStyle} to ${newStyle}`);
      shirtCanvases[newStyle].shirtCtx.drawImage(previousShirtCanvas, 0, 0);
      shirtCanvases[newStyle].originalDesign.getContext('2d').drawImage(previousShirtCanvas, 0, 0);
      shirtCanvases[newStyle].isEmpty = false;
    }
  }

  // Replace shirt canvas in DOM
  const shirtContainer = document.querySelector('.shirt-container');
  try {
    logger.info(`[${new Date().toISOString()}] Replacing shirtCanvas for ${newStyle}`);
    const currentCanvas = shirtContainer.querySelector('canvas.shirt-design');
    if (currentCanvas) {
      shirtContainer.replaceChild(shirtCanvases[newStyle].shirtCanvas, currentCanvas);
    } else {
      shirtContainer.appendChild(shirtCanvases[newStyle].shirtCanvas);
    }
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error replacing shirtCanvas:`, error);
  }

  // Update shirt base image
  const shirtBase = document.querySelector('.shirt-base');
  shirtBase.src = styleBackgrounds[newStyle];
  shirtBase.dataset.style = newStyle;

  // Update style button selection
  const styleButtons = document.querySelectorAll('.style-button');
  logger.debug(`[${new Date().toISOString()}] Updating ${styleButtons.length} style buttons for ${newStyle}`);
  styleButtons.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.style === newStyle);
  });

  // Update size button selection
  const currentSize = shirtCanvases[newStyle].size;
  const sizeButtons = document.querySelectorAll('.size-button');
  logger.debug(`[${new Date().toISOString()}] Updating ${sizeButtons.length} size buttons for size: ${currentSize}`);
  sizeButtons.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.size === currentSize);
  });

  // Update current style and color options
  currentStyle = newStyle;
  logger.debug(`[${new Date().toISOString()}] Calling updateShirtColorOptions for ${newStyle}`);
  updateShirtColorOptions(newStyle);
  logger.debug(`[${new Date().toISOString()}] Calling updateBackgroundColorOptions`);
  updateBackgroundColorOptions();
}

export function createShirtCanvas() {
  logger.debug(`[${new Date().toISOString()}] Creating shirt canvas`);
  const canvas = document.createElement('canvas');
  canvas.width = 213;
  canvas.height = 284;
  canvas.classList.add('shirt-design');
  const originalDesign = document.createElement('canvas');
  originalDesign.width = 213;
  originalDesign.height = 284;
  return {
    shirtCanvas: canvas,
    shirtCtx: createOptimizedContext(canvas),
    size: 'l',
    isEmpty: true,
    originalDesign: originalDesign,
    shirtColor: 'white',
    backgroundColor: 'transparent',
    customBackgroundColor: null // Initialize custom background color
  };
}

export function getCurrentShirtCanvas() {
  const canvas = shirtCanvases[currentStyle]?.shirtCanvas || document.getElementById('shirtCanvas');
  logger.debug(`[${new Date().toISOString()}] Getting current shirtCanvas for: ${currentStyle}`);
  return canvas;
}

export function getAllShirtCanvases() {
  logger.debug(`[${new Date().toISOString()}] Getting all shirt canvases: ${Object.keys(shirtCanvases).join(', ')}`);
  return { ...shirtCanvases, currentStyle };
}

export function setShirtCanvasEmpty() {
  if (shirtCanvases[currentStyle]) {
    shirtCanvases[currentStyle].isEmpty = true;
    shirtCanvases[currentStyle].originalDesign.getContext('2d').clearRect(0, 0, 213, 284);
    logger.info(`[${new Date().toISOString()}] Marked ${currentStyle} shirtCanvas as empty`);
  }
}