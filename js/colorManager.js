// colorManager.js
import { shirtColors } from './shirtColors.js';
import { logger } from './logger.js';
import { getAllShirtCanvases, getCurrentShirtCanvas } from './shirtCanvasManager.js';

const backgroundColors = [
  { name: 'transparent', value: 'transparent' },
  { name: 'white', value: '#ffffff' },
  { name: 'gray', value: '#808080' },
  { name: 'custom', value: '' }
];

export function initColorManager(domElements, tools) {
  // Color picker change for drawing
  domElements.colorPicker.addEventListener('input', () => {
    if (tools.currentTool && tools.currentTool !== 'eraser' && tools.currentTool !== 'water') {
      tools.currentTool.setColor(domElements.colorPicker.value);
    }
    logger.debug(`[${new Date().toISOString()}] Drawing color picker updated to: ${domElements.colorPicker.value}`);
    updateCustomColors(domElements.colorPicker.value);
  });
}

export function selectShirtColor(colorName) {
  const shirtCanvases = getAllShirtCanvases();
  const currentStyle = shirtCanvases.currentStyle;
  if (!shirtCanvases[currentStyle]) {
    logger.warn(`[${new Date().toISOString()}] No shirt canvas for style: ${currentStyle}`);
    return;
  }

  const colors = shirtColors[currentStyle] || shirtColors.man;
  const colorObj = colors.find(c => c.name === colorName);
  if (!colorObj) {
    logger.warn(`[${new Date().toISOString()}] Color not found: ${colorName}`);
    return;
  }

  let colorValue = colorObj.value;
  if (colorName === 'custom') {
    const colorPicker = document.querySelector('.color-picker-wrapper input[type="color"]');
    colorValue = colorPicker.value;
  }

  shirtCanvases[currentStyle].shirtColor = colorName;
  const shirtContainer = document.querySelector('.shirt-container');
  shirtContainer.style.backgroundColor = colorValue;

  const circles = document.querySelectorAll('.shirt-color-row .color-circle');
  logger.debug(`[${new Date().toISOString()}] Updating ${circles.length} shirt color circles for color: ${colorName}`);
  circles.forEach(circle => {
    circle.classList.toggle('selected', circle.dataset.shirtColor === colorName);
    if (circle.dataset.shirtColor === 'custom') {
      circle.style.backgroundColor = colorValue;
    }
  });

  logger.info(`[${new Date().toISOString()}] Selected shirt color: ${colorName} (${colorValue}) for ${currentStyle}`);
}

export function selectBackgroundColor(colorName, colorValue = null) {
  const shirtCanvases = getAllShirtCanvases();
  const currentStyle = shirtCanvases.currentStyle;
  if (!shirtCanvases[currentStyle]) {
    logger.warn(`[${new Date().toISOString()}] No shirt canvas for style: ${currentStyle}`);
    return;
  }

  const colorObj = backgroundColors.find(c => c.name === colorName);
  if (!colorObj) {
    logger.warn(`[${new Date().toISOString()}] Background color not found: ${colorName}`);
    return;
  }

  let finalColorValue = colorValue || colorObj.value;
  if (colorName === 'custom' && !colorValue) {
    const colorPicker = document.querySelector('.background-color-row input[type="color"]');
    finalColorValue = colorPicker ? colorPicker.value : (shirtCanvases[currentStyle].customBackgroundColor || '#E22222');
  }

  shirtCanvases[currentStyle].backgroundColor = colorName;
  if (colorName === 'custom') {
    shirtCanvases[currentStyle].customBackgroundColor = finalColorValue;
    logger.debug(`[${new Date().toISOString()}] Saved custom background color: ${finalColorValue} for ${currentStyle}`);
  }

  const shirtCanvas = getCurrentShirtCanvas();
  if (!shirtCanvas.parentNode) {
    logger.warn(`[${new Date().toISOString()}] Shirt canvas not in DOM, cannot apply background color: ${colorName}`);
  }
  shirtCanvas.style.backgroundColor = finalColorValue;
  logger.debug(`[${new Date().toISOString()}] Applied background color: ${finalColorValue} to shirtCanvas, computed: ${shirtCanvas.style.backgroundColor || window.getComputedStyle(shirtCanvas).backgroundColor}`);

  const circles = document.querySelectorAll('.background-color-row .color-circle');
  logger.debug(`[${new Date().toISOString()}] Updating ${circles.length} background color circles for color: ${colorName}`);
  circles.forEach(circle => {
    circle.classList.toggle('selected', circle.dataset.backgroundColor === colorName);
    if (circle.dataset.backgroundColor === 'custom') {
      circle.style.backgroundColor = finalColorValue;
    }
  });

  logger.info(`[${new Date().toISOString()}] Selected background color: ${colorName} (${finalColorValue}) for ${currentStyle}`);
}

function updateCustomColors(colorValue) {
  const shirtCanvases = getAllShirtCanvases();
  const currentStyle = shirtCanvases.currentStyle;
  if (!shirtCanvases[currentStyle]) {
    logger.debug(`[${new Date().toISOString()}] Skipping updateCustomColors: no shirt canvas for ${currentStyle}`);
    return;
  }

  if (shirtCanvases[currentStyle].shirtColor === 'custom') {
    logger.debug(`[${new Date().toISOString()}] Updating custom shirt color to: ${colorValue}`);
    selectShirtColor('custom');
  }
}

export function updateShirtColorOptions(style) {
  const shirtColorRow = document.querySelector('.shirt-color-row');
  const colorCircles = shirtColorRow.querySelectorAll('.color-circle');
  logger.debug(`[${new Date().toISOString()}] Removing ${colorCircles.length} existing shirt color circles`);
  colorCircles.forEach(circle => circle.remove());

  const colors = shirtColors[style] || shirtColors.man;
  colors.forEach(color => {
    const circle = document.createElement('div');
    circle.classList.add('color-circle');
    circle.dataset.shirtColor = color.name;
    circle.style.backgroundColor = color.value;
    circle.addEventListener('click', () => {
      logger.debug(`[${new Date().toISOString()}] Shirt color circle clicked: ${color.name}`);
      selectShirtColor(color.name);
    });
    shirtColorRow.appendChild(circle);
  });

  logger.debug(`[${new Date().toISOString()}] Created ${colors.length} shirt color circles for style: ${style}`);
  const shirtCanvases = getAllShirtCanvases();
  const selectedColor = shirtCanvases[style]?.shirtColor || 'white';
  logger.debug(`[${new Date().toISOString()}] Selecting default shirt color: ${selectedColor} for ${style}`);
  selectShirtColor(selectedColor);
}

export function updateBackgroundColorOptions() {
  const backgroundColorRow = document.querySelector('.background-color-row');
  const colorCircles = backgroundColorRow.querySelectorAll('.color-circle, input[type="color"]');
  logger.debug(`[${new Date().toISOString()}] Removing ${colorCircles.length} existing background color circles`);
  colorCircles.forEach(element => element.remove());

  backgroundColors.forEach(color => {
    if (color.name === 'custom') {
      const colorPicker = document.createElement('input');
      colorPicker.type = 'color';
      colorPicker.classList.add('color-picker', 'background-color-picker');
      const shirtCanvases = getAllShirtCanvases();
      const currentStyle = shirtCanvases.currentStyle;
      colorPicker.value = shirtCanvases[currentStyle]?.customBackgroundColor || '#E22222';
      logger.debug(`[${new Date().toISOString()}] Setting background color picker value to: ${colorPicker.value} for ${currentStyle}`);
      colorPicker.addEventListener('input', () => {
        logger.debug(`[${new Date().toISOString()}] Background color picker changed to: ${colorPicker.value}`);
        selectBackgroundColor('custom', colorPicker.value);
      });
      backgroundColorRow.appendChild(colorPicker);
    } else {
      const circle = document.createElement('div');
      circle.classList.add('color-circle');
      circle.dataset.backgroundColor = color.name;
      circle.style.backgroundColor = color.value;
      circle.addEventListener('click', () => {
        logger.debug(`[${new Date().toISOString()}] Background color circle clicked: ${color.name}`);
        selectBackgroundColor(color.name);
      });
      backgroundColorRow.appendChild(circle);
    }
  });

  logger.debug(`[${new Date().toISOString()}] Created ${backgroundColors.length} background color elements (including color picker)`);
  const shirtCanvases = getAllShirtCanvases();
  const currentStyle = shirtCanvases.currentStyle;
  const selectedBackground = shirtCanvases[currentStyle]?.backgroundColor || 'transparent';
  logger.debug(`[${new Date().toISOString()}] Selecting default background color: ${selectedBackground}`);
  selectBackgroundColor(selectedBackground);
}