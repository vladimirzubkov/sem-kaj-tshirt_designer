// js/main.js

import { Pencil, Brush, Eraser, Water, TextTool } from './tools.js';
import { generateDrawingCursor, generateTextCursor } from './cursorManager.js';
import { saveCanvasState, undo, redo, getCurrentHistoryIndex, getHistoryStatesLength, getRedoStatesLength } from './historyManager.js';

const drawCanvas = document.getElementById('drawCanvas');
const shirtCanvas = document.getElementById('shirtCanvas');
const ctx = drawCanvas.getContext('2d');
const shirtCtx = shirtCanvas.getContext('2d');
let drawing = false;
let currentTool = null;

// Canvas dimensions
const canvasWidth = drawCanvas.width;
const canvasHeight = drawCanvas.height;

// Shirt canvas dimensions
const shirtCanvasWidth = shirtCanvas.width;
const shirtCanvasHeight = shirtCanvas.height;

// Function to transfer design from drawCanvas to shirtCanvas
function transferDesignToShirt() {
  const designData = drawCanvas.toDataURL();
  const img = new Image();
  img.onload = () => {
    shirtCtx.clearRect(0, 0, shirtCanvasWidth, shirtCanvasHeight);
    const aspectRatio = canvasWidth / canvasHeight;
    let newWidth = shirtCanvasWidth;
    let newHeight = newWidth / aspectRatio;
    if (newHeight > shirtCanvasHeight) {
      newHeight = shirtCanvasHeight;
      newWidth = newHeight * aspectRatio;
    }
    const x = (shirtCanvasWidth - newWidth) / 2;
    const y = (shirtCanvasHeight - newHeight) / 2;
    shirtCtx.drawImage(img, x, y, newWidth, newHeight);
    saveCanvasState(drawCanvas, 'Transfer Design to Shirt', null);
  };
  img.src = designData;
}

// Function to save design as PNG
function saveDesign() {
  const dataURL = drawCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'tshirt-design.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  saveCanvasState(drawCanvas, 'Save Design', null);
}

// Function to load design from file
function loadDesign() {
  const loadInput = document.getElementById('loadDesignInput');
  loadInput.click();
}

const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.value = '#000000';
colorPicker.title = 'Color';

const colorPickerWrapper = document.querySelector('.color-picker-wrapper');
colorPickerWrapper.appendChild(colorPicker);

const toolsBar = document.querySelector('.tools-bar');
const completeButton = toolsBar.querySelector('button');

// Map tools using static names
const toolClasses = [Pencil, Brush, Eraser, Water, TextTool];
const tools = {};
toolClasses.forEach(ToolClass => {
  tools[ToolClass.name] = new ToolClass(ctx);
});

// Set tool labels dynamically
document.querySelectorAll('[data-tool-label]').forEach(label => {
  const toolName = label.dataset.toolLabel;
  const ToolClass = toolClasses.find(cls => cls.name === toolName);
  if (ToolClass) {
    label.textContent = ToolClass.displayName;
  }
});

// Update tool color on color picker change
colorPicker.addEventListener('input', () => {
  if (currentTool && currentTool !== tools.eraser && currentTool !== tools.water) {
    currentTool.setColor(colorPicker.value);
  }
});

// Function to position size value above slider thumb
function positionSizeValue(size) {
  const percentage = (size - sizeSlider.min) / (sizeSlider.max - sizeSlider.min);
  const thumbWidth = 16;
  const trackWidth = sizeSlider.offsetWidth - thumbWidth;
  const leftPosition = percentage * trackWidth + thumbWidth / 2 + 1;
  sizeValue.style.left = `${leftPosition}px`;
}

// Drag-and-drop handling
drawCanvas.addEventListener('dragover', (e) => {
  e.preventDefault();
  drawCanvas.classList.add('dragover');
});

drawCanvas.addEventListener('dragenter', (e) => {
  e.preventDefault();
  drawCanvas.classList.add('dragover');
});

drawCanvas.addEventListener('dragleave', (e) => {
  e.preventDefault();
  drawCanvas.classList.remove('dragover');
});

drawCanvas.addEventListener('drop', (e) => {
  e.preventDefault();
  drawCanvas.classList.remove('dragover');

  const file = e.dataTransfer.files[0];
  if (!file) return;

  const validTypes = ['image/svg+xml', 'image/png', 'image/gif', 'image/jpeg'];
  if (!validTypes.includes(file.type)) {
    alert('Please drop an SVG, PNG, GIF, or JPG file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const rect = drawCanvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      let newWidth = img.width;
      let newHeight = img.height;

      if (img.width > canvasWidth || img.height > canvasHeight) {
        const aspectRatio = img.width / img.height;
        if (img.width > img.height) {
          newWidth = canvasWidth;
          newHeight = newWidth / aspectRatio;
        } else {
          newHeight = canvasHeight;
          newWidth = newHeight * aspectRatio;
        }
        x = (canvasWidth - newWidth) / 2;
        y = (canvasHeight - newHeight) / 2;
      }

      ctx.drawImage(img, x, y, newWidth, newHeight);
      saveCanvasState(drawCanvas, 'Add Image', null);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Load design from file
document.getElementById('loadDesignInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validTypes = ['image/png'];
  if (!validTypes.includes(file.type)) {
    alert('Please load a PNG file saved from this editor.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      saveCanvasState(drawCanvas, 'Load Design', null);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Save and Load design buttons
document.getElementById('saveDesignButton').addEventListener('click', () => {
  saveDesign();
});

document.getElementById('loadDesignButton').addEventListener('click', () => {
  loadDesign();
});

// Update tool size on slider change
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
sizeSlider.addEventListener('input', () => {
  const size = parseInt(sizeSlider.value);
  sizeValue.textContent = size;
  positionSizeValue(size);
  if (currentTool) {
    currentTool.setSize(size);
    const cursorColor = size >= 128 ? '#FF0000' : '#000000';
    drawCanvas.style.cursor = currentTool === tools.text ? generateTextCursor(size, cursorColor) : generateDrawingCursor(size, cursorColor);
  }
});

// Tool selection with cursor handling
document.querySelectorAll('.tool-icon').forEach(el => {
  const toolName = el.dataset.tool;
  const effect = el.dataset.effect;
  if (toolName && tools[toolName]) {
    el.addEventListener('click', () => {
      document.querySelectorAll('.tool-icon').forEach(icon => {
        icon.classList.remove('selected');
      });
      el.classList.add('selected');
      currentTool = tools[toolName];
      if (currentTool && currentTool !== tools.eraser && currentTool !== tools.water) {
        currentTool.setColor(colorPicker.value);
      }
      const size = parseInt(sizeSlider.value);
      currentTool.setSize(size);
      sizeValue.textContent = size;
      positionSizeValue(size);

      const cursorColor = size >= 128 ? '#FF0000' : '#000000';
      drawCanvas.style.cursor = toolName === 'text' ? generateTextCursor(size, cursorColor) : generateDrawingCursor(size, cursorColor);
    });
  } else if (effect) {
    el.addEventListener('click', () => {
      transferDesignToShirt();
    });
  }
});

// Clear canvas
document.getElementById('clearButton').addEventListener('click', () => {
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  saveCanvasState(drawCanvas, 'Clear Canvas', null);
});

// Canvas events
drawCanvas.addEventListener('mousedown', (e) => {
  drawing = true;
  currentTool?.onMouseDown(e);
});

drawCanvas.addEventListener('mousemove', (e) => {
  if (drawing) {
    currentTool?.onMouseMove(e);
  }
  if (currentTool) {
    const size = parseInt(sizeSlider.value);
    const cursorColor = size >= 128 ? '#FF0000' : '#000000';
    drawCanvas.style.cursor = currentTool === tools.text ? generateTextCursor(size, cursorColor) : generateDrawingCursor(size, cursorColor);
  }
});

drawCanvas.addEventListener('mouseup', (e) => {
  if (drawing) {
    drawing = false;
    currentTool?.onMouseUp(e);
    if (currentTool) {
      const action = currentTool === tools.text ? 'Add Text' : 'Draw';
      saveCanvasState(drawCanvas, action, currentTool.constructor.name);
    }
  }
});

drawCanvas.addEventListener('mouseleave', (e) => {
  if (drawing) {
    drawing = false;
    currentTool?.onMouseUp(e);
    if (currentTool) {
      const action = currentTool === tools.text ? 'Add Text' : 'Draw';
      saveCanvasState(drawCanvas, action, currentTool.constructor.name);
    }
  }
  drawCanvas.style.cursor = currentTool === tools.text ? 'text' : 'default';
});

// Keyboard shortcuts for undo/redo
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undo(ctx, canvasWidth, canvasHeight);
  } else if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    redo(ctx, canvasWidth, canvasHeight);
  }
}, { capture: true });

// Browser history navigation
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.stateIndex !== undefined) {
    const targetIndex = e.state.stateIndex;
    const currentIndex = getCurrentHistoryIndex();

    if (targetIndex < currentIndex) {
      const steps = currentIndex - targetIndex;
      for (let i = 0; i < steps; i++) {
        undo(ctx, canvasWidth, canvasHeight);
      }
    } else if (targetIndex > currentIndex) {
      const steps = targetIndex - currentIndex;
      for (let i = 0; i < steps; i++) {
        redo(ctx, canvasWidth, canvasHeight);
      }
    }
    console.log(`Popstate: Target index: ${targetIndex}, Current index: ${currentIndex}`);
  } else {
    console.log('Popstate: No state to restore');
  }
});

// Initialize size value position
const initialSize = parseInt(sizeSlider.value);
sizeValue.textContent = initialSize;
positionSizeValue(initialSize);

// Set initial tool (Pencil) as selected
document.querySelector('.tool-icon[data-tool="pencil"]').classList.add('selected');
currentTool = tools.pencil;
drawCanvas.style.cursor = generateDrawingCursor(initialSize);

// Save initial canvas state
saveCanvasState(drawCanvas, 'Initial State', null);