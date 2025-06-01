// js/uiManager.js

import { generateDrawingCursor, generateTextCursor } from './cursorManager.js';
import { effectHandlers } from './effectManager.js';
import { showProgress, hideProgress } from './progressManager.js';
import { saveCanvasState } from './canvasManager.js';

// Manage shirt canvases for styles
let shirtCanvases = {
  male: null,
  female: null,
  kid: null
};
export let currentStyle = 'male';
let isEffectActive = false;
let currentEffect = null;

// Size scaling factors
export const sizeScales = {
  xxl: 1.2,
  xl: 1.1,
  l: 1,
  m: 0.9,
  s: 0.8
};

// Style to background mapping
const styleBackgrounds = {
  male: 'assets/tshirt-placeholder-man.png',
  female: 'assets/tshirt-placeholder-woman.png',
  kid: 'assets/tshirt-placeholder-kid.png'
};

// Initialize UI elements
export function initUI(tools, drawCanvas, shirtCanvas) {
  console.log(`[${new Date().toISOString()}] Initializing UI`);
  const colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.value = '#000000';
  colorPicker.title = 'Color';
  const colorPickerWrapper = document.querySelector('.color-picker-wrapper');
  colorPickerWrapper.appendChild(colorPicker);

  const sizeSlider = document.getElementById('sizeSlider');
  const sizeValue = document.getElementById('sizeValue');

  // Set tool labels dynamically
  document.querySelectorAll('[data-tool-label]').forEach(label => {
    const toolName = label.dataset.toolLabel;
    const tool = tools[toolName];
    if (tool) {
      label.textContent = tool.constructor.displayName || toolName;
    }
  });

  // Color picker change
  colorPicker.addEventListener('input', () => {
    if (tools.currentTool && tools.currentTool !== tools.eraser && tools.currentTool !== tools.water) {
      tools.currentTool.setColor(colorPicker.value);
    }
  });

  // Size slider change
  sizeSlider.addEventListener('input', () => {
    const size = parseInt(sizeSlider.value);
    sizeValue.textContent = size;
    positionSizeValue(size);
    if (tools.currentTool) {
      tools.currentTool.setSize(size);
      const cursorColor = size >= 128 ? '#FF0000' : '#000000';
      drawCanvas.style.cursor = tools.currentTool === tools.text ? generateTextCursor(size, cursorColor) : generateDrawingCursor(size, cursorColor);
    }
  });

  // Tool and effect selection
  document.querySelectorAll('.tool-icon, .tools-bar .tool-icon').forEach(el => {
    const toolName = el.dataset.tool;
    const effect = el.dataset.effect;
    if (toolName && tools[toolName]) {
      console.log(`[${new Date().toISOString()}] Binding tool: ${toolName}`);
      el.addEventListener('click', () => selectTool(tools, toolName, drawCanvas));
    } else if (effect) {
      console.log(`[${new Date().toISOString()}] Binding effect: ${effect}`);
      el.addEventListener('mousedown', () => {
        console.log(`[${new Date().toISOString()}] Effect button mousedown: ${effect}`);
        transferDesignToShirt(effect, drawCanvas, getCurrentShirtCanvas());
      });
      el.addEventListener('mouseup', () => {
        console.log(`[${new Date().toISOString()}] Effect button mouseup: ${effect}`);
        stopEffect();
      });
      el.addEventListener('mouseleave', () => {
        console.log(`[${new Date().toISOString()}] Effect button mouseleave: ${effect}`);
        stopEffect();
      });
    }
  });

  // Style selection
  document.querySelectorAll('.style-button').forEach(button => {
    console.log(`[${new Date().toISOString()}] Binding style button: ${button.dataset.style}`);
    button.addEventListener('click', () => {
      switchStyle(button.dataset.style, drawCanvas, shirtCanvas);
    });
  });

  // Size selection
  document.querySelectorAll('.size-button').forEach(button => {
    console.log(`[${new Date().toISOString()}] Binding size button: ${button.dataset.size}`);
    button.addEventListener('click', () => {
      applySizeScaling(button.dataset.size, drawCanvas);
    });
  });

  // Initialize size value
  const initialSize = parseInt(sizeSlider.value);
  sizeValue.textContent = initialSize;
  positionSizeValue(initialSize);

  // Set default style
  switchStyle('male', drawCanvas, shirtCanvas);
}

// Select a tool
export function selectTool(tools, toolName, drawCanvas) {
  console.log(`[${new Date().toISOString()}] Selected tool: ${toolName}`);
  document.querySelectorAll('.tool-icon').forEach(icon => icon.classList.remove('selected'));
  const toolIcon = document.querySelector(`.tool-icon[data-tool="${toolName}"]`);
  if (toolIcon) toolIcon.classList.add('selected');
  tools.currentTool = tools[toolName];
  if (tools.currentTool && tools.currentTool !== tools.eraser && tools.currentTool !== tools.water) {
    const colorPicker = document.querySelector('input[type="color"]');
    tools.currentTool.setColor(colorPicker.value);
  }
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeValue = document.getElementById('sizeValue');
  const size = parseInt(sizeSlider.value);
  tools.currentTool.setSize(size);
  sizeValue.textContent = size;
  positionSizeValue(size);
  const cursorColor = size >= 128 ? '#FF0000' : '#000000';
  drawCanvas.style.cursor = toolName === 'text' ? generateTextCursor(size, cursorColor) : generateDrawingCursor(size, cursorColor);
}

// Position size value above slider
function positionSizeValue(size) {
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeValue = document.getElementById('sizeValue');
  const percentage = (size - sizeSlider.min) / (sizeSlider.max - sizeSlider.min);
  const thumbWidth = 16;
  const trackWidth = sizeSlider.offsetWidth - thumbWidth;
  const leftPosition = percentage * trackWidth + thumbWidth / 2 + 1;
  sizeValue.style.left = `${leftPosition}px`;
}

// Create a new shirt canvas
function createShirtCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 213;
  canvas.height = 284;
  canvas.classList.add('shirt-design');
  const originalDesign = document.createElement('canvas');
  originalDesign.width = 213;
  originalDesign.height = 284;
  return { 
    shirtCanvas: canvas, 
    shirtCtx: canvas.getContext('2d'), 
    size: 'l', 
    isEmpty: true,
    originalDesign: originalDesign
  };
}

// Switch to a different style
export function switchStyle(newStyle, drawCanvas, initialShirtCanvas) {
  if (newStyle === currentStyle) return;

  console.log(`[${new Date().toISOString()}] Switching to style: ${newStyle}`);
  const previousShirtCanvas = shirtCanvases[currentStyle]?.shirtCanvas || initialShirtCanvas;

  // Save current state
  saveCanvasState(drawCanvas, previousShirtCanvas, `Switch Style (${currentStyle})`, null);

  // Initialize new style canvas if not exists
  if (!shirtCanvases[newStyle]) {
    console.log(`[${new Date().toISOString()}] Creating new shirt canvas for: ${newStyle}`);
    shirtCanvases[newStyle] = createShirtCanvas();
  }

  // Copy design from previous shirt canvas if new canvas is empty
  if (shirtCanvases[newStyle].isEmpty) {
    const previousCtx = previousShirtCanvas.getContext('2d');
    const previousData = previousCtx.getImageData(0, 0, 213, 284).data;
    let hasContent = false;
    for (let i = 3; i < previousData.length; i += 4) {
      if (previousData[i] !== 0) {
        hasContent = true;
        break;
      }
    }
    if (hasContent) {
      console.log(`[${new Date().toISOString()}] Copying design from ${currentStyle} to ${newStyle}`);
      shirtCanvases[newStyle].shirtCtx.drawImage(previousShirtCanvas, 0, 0);
      shirtCanvases[newStyle].originalDesign.getContext('2d').drawImage(previousShirtCanvas, 0, 0);
      shirtCanvases[newStyle].isEmpty = false;
      // Apply scaling for the copied design
      applySizeScaling(shirtCanvases[newStyle].size, drawCanvas);
    }
  }

  // Replace shirt canvas
  const shirtContainer = document.querySelector('.shirt-container');
  try {
    console.log(`[${new Date().toISOString()}] Replacing shirtCanvas for ${newStyle}`);
    const currentCanvas = shirtContainer.querySelector('canvas.shirt-design');
    if (currentCanvas) {
      shirtContainer.replaceChild(shirtCanvases[newStyle].shirtCanvas, currentCanvas);
    } else {
      shirtContainer.appendChild(shirtCanvases[newStyle].shirtCanvas);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error replacing shirtCanvas:`, error);
  }

  // Update shirt base background
  const shirtBase = document.querySelector('.shirt-base');
  shirtBase.src = styleBackgrounds[newStyle];
  shirtBase.dataset.style = newStyle;

  // Update style button selection
  document.querySelectorAll('.style-button').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.style === newStyle);
  });

  // Update size button selection
  const currentSize = shirtCanvases[newStyle].size;
  document.querySelectorAll('.size-button').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.size === currentSize);
  });

  currentStyle = newStyle;
}

// Apply size scaling to shirt canvas
export function applySizeScaling(size, drawCanvas) {
  console.log(`[${new Date().toISOString()}] Applying size: ${size}`);
  const styleData = shirtCanvases[currentStyle] || { shirtCanvas: document.getElementById('shirtCanvas'), shirtCtx: document.getElementById('shirtCanvas').getContext('2d'), size: 'l', isEmpty: true, originalDesign: document.createElement('canvas') };
  
  // Update size
  styleData.size = size;

  // Update size button selection
  document.querySelectorAll('.size-button').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.size === size);
  });

  // Apply scaling if not empty
  if (!styleData.isEmpty) {
    console.log(`[${new Date().toISOString()}] Rescaling shirt canvas for size: ${size}`);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 213;
    tempCanvas.height = 284;
    const tempCtx = tempCanvas.getContext('2d');
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

    // Verify scaled content
    const scaledData = styleData.shirtCtx.getImageData(0, 0, 213, 284).data;
    let scaledNonZeroPixels = 0;
    for (let i = 3; i < scaledData.length; i += 4) {
      if (scaledData[i] !== 0) scaledNonZeroPixels++;
    }
    console.log(`[${new Date().toISOString()}] Shirt canvas non-zero pixels after scaling: ${scaledNonZeroPixels}`);
  }

  saveCanvasState(drawCanvas, styleData.shirtCanvas, `Change Size (${size.toUpperCase()})`, null);
}

// Get current shirt canvas
export function getCurrentShirtCanvas() {
  const canvas = shirtCanvases[currentStyle]?.shirtCanvas || document.getElementById('shirtCanvas');
  console.log(`[${new Date().toISOString()}] Getting current shirtCanvas for: ${currentStyle}`);
  return canvas;
}

// Get all shirt canvases
export function getAllShirtCanvases() {
  return shirtCanvases;
}

// Mark current shirt canvas as empty
export function setShirtCanvasEmpty() {
  if (shirtCanvases[currentStyle]) {
    shirtCanvases[currentStyle].isEmpty = true;
    shirtCanvases[currentStyle].originalDesign.getContext('2d').clearRect(0, 0, 213, 284);
    console.log(`[${new Date().toISOString()}] Marked ${currentStyle} shirtCanvas as empty`);
  }
}

// Transfer design to shirt with effect
export function transferDesignToShirt(effect, drawCanvas, shirtCanvas) {
  if (!shirtCanvas) {
    console.error(`[${new Date().toISOString()}] No shirt canvas available for effect: ${effect}`);
    return;
  }
  const shirtCtx = shirtCanvas.getContext('2d');
  const progressBar = document.getElementById('effectProgress');

  if (isEffectActive) {
    console.log(`[${new Date().toISOString()}] Effect ${effect} blocked: another effect is active.`);
    return;
  }

  console.log(`[${new Date().toISOString()}] Starting effect: ${effect} on ${currentStyle} shirtCanvas`);
  isEffectActive = true;
  currentEffect = effect;
  const maxDuration = effect === 'stamp' ? 500 : effect === 'roll' ? 2000 : effect === 'shred' ? 7000 : effect === 'mixer' ? 5000 : 20000;

  // Check if drawCanvas has content
  const drawCtx = drawCanvas.getContext('2d');
  const drawData = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height).data;
  let drawNonZeroPixels = 0;
  for (let i = 3; i < drawData.length; i += 4) {
    if (drawData[i] !== 0) drawNonZeroPixels++;
  }
  console.log(`[${new Date().toISOString()}] Draw canvas non-zero pixels: ${drawNonZeroPixels}`);

  // Initialize shirtCanvases[currentStyle] if not exists
  if (!shirtCanvases[currentStyle]) {
    console.log(`[${new Date().toISOString()}] Creating shirt canvas for ${currentStyle} in transferDesign`);
    shirtCanvases[currentStyle] = createShirtCanvas();
    shirtCanvases[currentStyle].shirtCanvas = shirtCanvas;
    shirtCanvases[currentStyle].shirtCtx = shirtCtx;
  }

  // Create temporary canvas for effect
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 213;
  tempCanvas.height = 284;
  const tempCtx = tempCanvas.getContext('2d');

  // Apply the effect on tempCanvas
  effectHandlers[effect](drawCanvas, tempCtx, 0, maxDuration, (finalProgress) => {
    console.log(`[${new Date().toISOString()}] Effect ${effect} progress: ${finalProgress * 100}%`);
    showProgress(progressBar, finalProgress);

    // Check if tempCanvas has content
    const tempData = tempCtx.getImageData(0, 0, 213, 284).data;
    let tempNonZeroPixels = 0;
    for (let i = 3; i < tempData.length; i += 4) {
      if (tempData[i] !== 0) tempNonZeroPixels++;
    }
    console.log(`[${new Date().toISOString()}] Temp canvas non-zero pixels after effect: ${tempNonZeroPixels}`);

    // Always transfer tempCanvas to shirtCanvas
    if (!shirtCanvases[currentStyle].isEmpty) {
      shirtCtx.drawImage(shirtCanvases[currentStyle].originalDesign, 0, 0);
    }
    shirtCtx.drawImage(tempCanvas, 0, 0);

    // Save to originalDesign
    shirtCanvases[currentStyle].originalDesign.getContext('2d').drawImage(shirtCanvas, 0, 0);
    shirtCanvases[currentStyle].isEmpty = false;

    // Apply scaling
    const styleData = shirtCanvases[currentStyle];
    const scale = sizeScales[styleData.size];
    const scaledWidth = 213 * scale;
    const scaledHeight = 284 * scale;
    const offsetX = (213 - scaledWidth) / 2;
    const offsetY = (284 - scaledHeight) / 2;

    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = 213;
    scaledCanvas.height = 284;
    const scaledCtx = scaledCanvas.getContext('2d');
    scaledCtx.drawImage(shirtCanvas, 0, 0);

    shirtCtx.clearRect(0, 0, 213, 284);
    shirtCtx.drawImage(
      scaledCanvas,
      0, 0, 213, 284,
      offsetX, offsetY, scaledWidth, scaledHeight
    );

    // Verify final shirtCanvas content
    const finalShirtData = shirtCtx.getImageData(0, 0, 213, 284).data;
    let finalShirtNonZeroPixels = 0;
    for (let i = 3; i < finalShirtData.length; i += 4) {
      if (finalShirtData[i] !== 0) finalShirtNonZeroPixels++;
    }
    console.log(`[${new Date().toISOString()}] Shirt canvas non-zero pixels after scaling: ${finalShirtNonZeroPixels}`);

    saveCanvasState(drawCanvas, shirtCanvas, `Transfer Design to Shirt (${effect.charAt(0).toUpperCase() + effect.slice(1)})`, null);

    if (finalProgress === 1 || !isEffectActive) {
      console.log(`[${new Date().toISOString()}] Effect ${effect} completed with progress: ${finalProgress}`);
      isEffectActive = false;
      currentEffect = null;
      hideProgress(progressBar);
    }
  }, () => isEffectActive);
}

// Stop applying effect
export function stopEffect() {
  console.log(`[${new Date().toISOString()}] Stopping effect application`);
  isEffectActive = false;
  currentEffect = null;
}