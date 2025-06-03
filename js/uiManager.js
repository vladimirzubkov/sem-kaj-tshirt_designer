// uiManager.js
import { initToolManager, selectTool } from './toolManager.js';
import { initColorManager, selectShirtColor, selectBackgroundColor, updateBackgroundColorOptions, updateShirtColorOptions } from './colorManager.js';
import { initSizeManager, applySizeScaling } from './sizeManager.js';
import { initEffectManager } from './effectManagerUI.js';
import { switchStyle, getCurrentShirtCanvas, getAllShirtCanvases } from './shirtCanvasManager.js';
import { logger } from './logger.js';

// Main UI initialization function
export function initUI(tools, drawCanvas, shirtCanvas) {
  logger.info(`[${new Date().toISOString()}] Initializing UI`);

  // Cache DOM elements for performance
  const domElements = {
    colorPicker: document.createElement('input'),
    sizeSlider: document.getElementById('sizeSlider'),
    sizeValue: document.getElementById('sizeValue'),
    styleButtons: document.querySelectorAll('.style-button'),
    sizeButtons: document.querySelectorAll('.size-button'),
    shirtColorCircles: document.querySelectorAll('.shirt-color-row .color-circle'),
    backgroundColorCircles: document.querySelectorAll('.background-color-row .color-circle')
  };

  // Check critical DOM elements
  const colorPickerWrapper = document.querySelector('.color-picker-wrapper');
  const shirtColorRow = document.querySelector('.shirt-color-row');
  const backgroundColorRow = document.querySelector('.background-color-row');
  if (!colorPickerWrapper || !shirtColorRow || !backgroundColorRow) {
    logger.error(`[${new Date().toISOString()}] Missing critical DOM elements: colorPickerWrapper=${!!colorPickerWrapper}, shirtColorRow=${!!shirtColorRow}, backgroundColorRow=${!!backgroundColorRow}`);
    return;
  }

  // Log initial color circles count
  logger.debug(`[${new Date().toISOString()}] Initial shirt color circles: ${domElements.shirtColorCircles.length}, background color circles: ${domElements.backgroundColorCircles.length}`);

  // Configure color picker input
  domElements.colorPicker.type = 'color';
  domElements.colorPicker.value = '#000000';
  domElements.colorPicker.title = 'Color';
  colorPickerWrapper.appendChild(domElements.colorPicker);

  // Initialize core modules
  initToolManager(tools, drawCanvas, domElements);
  initColorManager(domElements, tools);
  initSizeManager(tools, drawCanvas, domElements);
  initEffectManager(tools, drawCanvas, shirtCanvas);

  // Bind style button click events
  domElements.styleButtons.forEach(button => {
    button.addEventListener('click', () => {
      logger.debug(`[${new Date().toISOString()}] Style button clicked: ${button.dataset.style}`);
      switchStyle(button.dataset.style, drawCanvas, shirtCanvas);
    });
  });

  // Bind size button click events
  domElements.sizeButtons.forEach(button => {
    button.addEventListener('click', () => {
      logger.debug(`[${new Date().toISOString()}] Size button clicked: ${button.dataset.size}`);
      applySizeScaling(button.dataset.size, drawCanvas);
    });
  });

  // Initialize color options after DOM is ready
  const initColors = () => {
    logger.info(`[${new Date().toISOString()}] Initializing colors`);

    // Ensure shirt canvas is in DOM
    const shirtContainer = document.querySelector('.shirt-container');
    const currentCanvas = shirtContainer.querySelector('canvas.shirt-design');
    const managedCanvas = getAllShirtCanvases().man.shirtCanvas;
    logger.debug(`[${new Date().toISOString()}] Checking shirt canvas in DOM: currentCanvas=${!!currentCanvas}, managedCanvasInDOM=${!!managedCanvas.parentNode}`);
    if (!currentCanvas || currentCanvas !== managedCanvas) {
      logger.info(`[${new Date().toISOString()}] Adding or replacing shirt canvas in DOM`);
      if (currentCanvas) {
        shirtContainer.replaceChild(managedCanvas, currentCanvas);
      } else {
        shirtContainer.appendChild(managedCanvas);
      }
      logger.debug(`[${new Date().toISOString()}] Shirt canvas styles after adding: display=${managedCanvas.style.display || window.getComputedStyle(managedCanvas).display}, visibility=${managedCanvas.style.visibility || window.getComputedStyle(managedCanvas).visibility}, zIndex=${managedCanvas.style.zIndex || window.getComputedStyle(managedCanvas).zIndex}`);
    }

    updateShirtColorOptions('man');
    updateBackgroundColorOptions();
    selectShirtColor('white');
    selectBackgroundColor('transparent');

    // Log canvas background style after selection
    logger.debug(`[${new Date().toISOString()}] Shirt canvas background after init: ${managedCanvas.style.backgroundColor || window.getComputedStyle(managedCanvas).backgroundColor}`);

    logger.debug(`[${new Date().toISOString()}] Post-init color circles: shirt=${document.querySelectorAll('.shirt-color-row .color-circle').length}, background=${document.querySelectorAll('.background-color-row .color-circle').length}`);
  };

  // Initialize colors after DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    logger.debug(`[${new Date().toISOString()}] DOM ready state: ${document.readyState}, calling initColors`);
    initColors();
  } else {
    logger.debug(`[${new Date().toISOString()}] DOM not ready, waiting for DOMContentLoaded`);
    document.addEventListener('DOMContentLoaded', () => {
      logger.debug(`[${new Date().toISOString()}] DOMContentLoaded fired, calling initColors`);
      initColors();
    });
  }

  // Set default tool
  selectTool(tools, 'pencil', drawCanvas);
}