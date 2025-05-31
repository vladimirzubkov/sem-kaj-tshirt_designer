// js/main.js

import { Pencil, Brush, Eraser, Water, TextTool } from './tools.js';

const drawCanvas = document.getElementById('drawCanvas');
const ctx = drawCanvas.getContext('2d');
let drawing = false;
let currentTool = null;

// Canvas dimensions
const canvasWidth = drawCanvas.width;
const canvasHeight = drawCanvas.height;

// History for undo/redo
let historyStates = [];
let redoStates = [];

// Save canvas state to history with tool information
function saveCanvasState(action, toolName) {
  const state = drawCanvas.toDataURL();
  historyStates.push({ state, action, toolName });
  redoStates = []; // Clear redo stack on new action
  // Add to browser history with descriptive message
  const historyMessage = toolName ? `${action} with ${toolName}` : action;
  window.history.pushState({ stateIndex: historyStates.length - 1 }, historyMessage, `#${historyMessage.replace(/\s+/g, '-')}`);
  // Update document title to reflect the action and tool
  document.title = `T-Shirt Editor | ${historyMessage}`;
  console.log(`Saved state: ${historyMessage}, History length: ${historyStates.length}, Redo length: ${redoStates.length}`);
}

// Restore canvas state
function restoreCanvasState(state) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0);
    console.log('Restored canvas state');
  };
  img.onerror = () => {
    console.error('Failed to restore canvas state');
  };
  img.src = state;
}

// Undo action
function undo() {
  if (historyStates.length <= 1) {
    console.log('Cannot undo: no more states to revert to');
    return; // Keep at least one state
  }
  const lastState = historyStates.pop();
  redoStates.push(lastState);
  const previousState = historyStates[historyStates.length - 1];
  restoreCanvasState(previousState.state);
  // Update document title to reflect the undone state
  const historyMessage = previousState.toolName ? `${previousState.action} with ${previousState.toolName}` : previousState.action;
  document.title = `T-Shirt Editor | ${historyMessage}`;
  console.log(`Undo: History length: ${historyStates.length}, Redo length: ${redoStates.length}`);
}

// Redo action
function redo() {
  if (redoStates.length === 0) {
    console.log('Cannot redo: no states to redo');
    return;
  }
  const nextState = redoStates.pop();
  historyStates.push(nextState);
  restoreCanvasState(nextState.state);
  // Update document title to reflect the redone state
  const historyMessage = nextState.toolName ? `${nextState.action} with ${nextState.toolName}` : nextState.action;
  document.title = `T-Shirt Editor | ${historyMessage}`;
  console.log(`Redo: History length: ${historyStates.length}, Redo length: ${redoStates.length}`);
}

// Function to generate a custom cursor SVG for drawing tools (circle)
function generateDrawingCursor(size, color = '#000000') {
  const maxCursorSize = 128;
  const scale = size > maxCursorSize ? maxCursorSize / size : 1;
  const cursorSize = Math.min(size, maxCursorSize);
  const radius = (size / 2) * scale;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}">
      <circle cx="${cursorSize / 2}" cy="${cursorSize / 2}" r="${radius - 1}" fill="none" stroke="${color}" stroke-width="1"/>
    </svg>
  `;
  return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${cursorSize / 2} ${cursorSize / 2}, auto`;
}

// Function to generate a custom cursor SVG for TextTool (vertical line with serifs)
function generateTextCursor(size, color = '#000000') {
  const maxCursorSize = 128;
  const scale = size > maxCursorSize ? maxCursorSize / size : 1;
  const cursorHeight = Math.min(size * 0.75, maxCursorSize);
  const width = 10 * scale;
  const height = cursorHeight;
  const serifLength = Math.min(size * 0.15, maxCursorSize * 0.15);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <line x1="${width / 2}" y1="0" x2="${width / 2}" y2="${height}" stroke="${color}" stroke-width="2"/>
      <line x1="${width / 2 - serifLength}" y1="0" x2="${width / 2 + serifLength}" y2="0" stroke="${color}" stroke-width="2"/>
      <line x1="${width / 2 - serifLength}" y1="${height}" x2="${width / 2 + serifLength}" y2="${height}" stroke="${color}" stroke-width="2"/>
    </svg>
  `;
  return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${width / 2} ${height}, auto`;
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

  // Check file type (SVG, PNG, GIF, JPG)
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

      // Check if image is larger than canvas
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

      // Draw image on canvas and save state
      ctx.drawImage(img, x, y, newWidth, newHeight);
      saveCanvasState('Add Image', null);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
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
  el.addEventListener('click', () => {
    const toolName = el.dataset.tool;
    if (toolName && tools[toolName]) {
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
    }
  });
});

// Clear canvas
document.getElementById('clearButton').addEventListener('click', () => {
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  saveCanvasState('Clear Canvas', null);
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
      saveCanvasState(action, currentTool.constructor.name);
    }
  }
});

drawCanvas.addEventListener('mouseleave', (e) => {
  if (drawing) {
    drawing = false;
    currentTool?.onMouseUp(e);
    if (currentTool) {
      const action = currentTool === tools.text ? 'Add Text' : 'Draw';
      saveCanvasState(action, currentTool.constructor.name);
    }
  }
  drawCanvas.style.cursor = currentTool === tools.text ? 'text' : 'default';
});

// Keyboard shortcuts for undo/redo
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undo();
  } else if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    redo();
  }
}, { capture: true });

// Browser history navigation
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.stateIndex !== undefined) {
    const targetIndex = e.state.stateIndex;
    const currentIndex = historyStates.length - 1;

    if (targetIndex < currentIndex) {
      const steps = currentIndex - targetIndex;
      for (let i = 0; i < steps; i++) {
        undo();
      }
    } else if (targetIndex > currentIndex) {
      const steps = targetIndex - currentIndex;
      for (let i = 0; i < steps; i++) {
        redo();
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
saveCanvasState('Initial State', null);