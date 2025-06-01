// js/main.js

import { Pencil, Brush, Eraser, Water, TextTool } from './tools.js';
import { generateDrawingCursor, generateTextCursor } from './cursorManager.js';
import { saveCanvasState, undo, redo, getCurrentHistoryIndex, getHistoryStatesLength, getRedoStatesLength } from './historyManager.js';
import { effectHandlers } from './effectManager.js';
import { showProgress, hideProgress } from './progressManager.js';

// Access jsPDF from CDN
const { jsPDF } = window.jspdf;

const drawCanvas = document.getElementById('drawCanvas');
const shirtCanvas = document.getElementById('shirtCanvas');
const progressBar = document.getElementById('effectProgress');
const ctx = drawCanvas.getContext('2d');
const shirtCtx = shirtCanvas.getContext('2d');
let drawing = false;
let currentTool = null;
let isEffectActive = false;
let effectStartTime = 0;
let currentEffect = null; // Track the current effect for saving to history

// Canvas dimensions
const canvasWidth = drawCanvas.width;  // 375
const canvasHeight = drawCanvas.height; // 500

// Shirt canvas dimensions
const shirtCanvasWidth = shirtCanvas.width;   // 213
const shirtCanvasHeight = shirtCanvas.height; // 284

// Check visibility of shirtCanvas
console.log(`[${new Date().toISOString()}] shirtCanvas visibility: visibility=${shirtCanvas.style.visibility}, display=${window.getComputedStyle(shirtCanvas).display}, zIndex=${window.getComputedStyle(shirtCanvas).zIndex}`);

// Function to transfer design from drawCanvas to shirtCanvas with effect
function transferDesignToShirt(effect) {
  if (isEffectActive) {
    console.log(`[${new Date().toISOString()}] Effect ${effect} blocked: another effect is active.`);
    return;
  }

  console.log(`[${new Date().toISOString()}] Starting effect: ${effect}`);
  isEffectActive = true;
  currentEffect = effect; // Store the current effect
  effectStartTime = performance.now();
  const maxDuration = (effect === 'stamp') ? 500 : (effect === 'roll') ? 2000 : (effect === 'shred') ? 7000 : (effect === 'mixer') ? 5000 : 20000; // 0.5s for stamp, 2s for roll, 7s for shred, 5s for mixer, 20s for spray

  // Apply the effect once and let the effect handle its own timing
  effectHandlers[effect](drawCanvas, shirtCtx, 0, maxDuration, (finalProgress) => {
    console.log(`[${new Date().toISOString()}] Effect ${effect} progress: ${finalProgress * 100}%`);
    showProgress(progressBar, finalProgress);
    if (finalProgress === 1 || !isEffectActive) {
      console.log(`[${new Date().toISOString()}] Effect ${effect} completed with progress: ${finalProgress}`);
      isEffectActive = false;
      hideProgress(progressBar);
      // Save the final state
      saveCanvasState(drawCanvas, shirtCanvas, `Transfer Design to Shirt (${effect.charAt(0).toUpperCase() + effect.slice(1)})`, null);
    }
  }, () => isEffectActive);
}

// Function to stop applying effect
function stopEffect() {
  console.log(`[${new Date().toISOString()}] Stopping effect application`);
  if (isEffectActive && currentEffect) {
    // Save the final state before stopping
    saveCanvasState(drawCanvas, shirtCanvas, `Transfer Design to Shirt (${currentEffect.charAt(0).toUpperCase() + currentEffect.slice(1)})`, null);
  }
  isEffectActive = false;
  currentEffect = null;
}

// Function to reset shirt (clear shirtCanvas)
function resetShirt() {
  console.log(`[${new Date().toISOString()}] Resetting shirt`);
  shirtCtx.clearRect(0, 0, shirtCanvasWidth, shirtCanvasHeight);
  saveCanvasState(drawCanvas, shirtCanvas, 'Reset Shirt', null);
}

// Function to save design as PNG
function saveDesign() {
  console.log(`[${new Date().toISOString()}] Saving design`);
  const dataURL = drawCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'tshirt-design.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  saveCanvasState(drawCanvas, shirtCanvas, 'Save Design', null);
}

// Function to load design from file
function loadDesign() {
  console.log(`[${new Date().toISOString()}] Loading design`);
  const loadInput = document.getElementById('loadDesignInput');
  loadInput.click();
}

// Function to export design to PDF (from shirtCanvas)
function exportToPDF() {
  console.log(`[${new Date().toISOString()}] Exporting to PDF`);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [shirtCanvasWidth, shirtCanvasHeight + 50]
  });

  doc.setFontSize(16);
  doc.text('T-Shirt Design', 20, 30);

  const designData = shirtCanvas.toDataURL('image/png'); // Use shirtCanvas (result after effects)
  doc.addImage(designData, 'PNG', 0, 50, shirtCanvasWidth, shirtCanvasHeight);

  doc.save('tshirt-design.pdf');
  saveCanvasState(drawCanvas, shirtCanvas, 'Export to PDF', null);
}

// Function to "send" PDF via email (stub, from shirtCanvas)
function sendEmail() {
  console.log(`[${new Date().toISOString()}] Sending email (stub)`);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [shirtCanvasWidth, shirtCanvasHeight + 50]
  });

  doc.setFontSize(16);
  doc.text('T-Shirt Design', 20, 30);

  const designData = shirtCanvas.toDataURL('image/png'); // Use shirtCanvas (result after effects)
  doc.addImage(designData, 'PNG', 0, 50, shirtCanvasWidth, shirtCanvasHeight);

  const dataURL = doc.output('datauristring');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'tshirt-design-for-email.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert('PDF has been "sent" via email. In a real application, this would send the PDF to an email server. For now, it has been downloaded.');
  saveCanvasState(drawCanvas, shirtCanvas, 'Send Email', null);
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
  console.log(`[${new Date().toISOString()}] Drag over canvas`);
  drawCanvas.classList.add('dragover');
});

drawCanvas.addEventListener('dragenter', (e) => {
  e.preventDefault();
  console.log(`[${new Date().toISOString()}] Drag enter canvas`);
  drawCanvas.classList.add('dragover');
});

drawCanvas.addEventListener('dragleave', (e) => {
  e.preventDefault();
  console.log(`[${new Date().toISOString()}] Drag leave canvas`);
  drawCanvas.classList.remove('dragover');
});

drawCanvas.addEventListener('drop', (e) => {
  e.preventDefault();
  console.log(`[${new Date().toISOString()}] Drop on canvas`);
  drawCanvas.classList.remove('dragover');

  const file = e.dataTransfer.files[0];
  if (!file) {
    console.log(`[${new Date().toISOString()}] No file dropped`);
    return;
  }

  const validTypes = ['image/svg+xml', 'image/png', 'image/gif', 'image/jpeg'];
  if (!validTypes.includes(file.type)) {
    console.log(`[${new Date().toISOString()}] Invalid file type: ${file.type}`);
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

      console.log(`[${new Date().toISOString()}] Drawing image at x: ${x}, y: ${y}, width: ${newWidth}, height: ${newHeight}`);
      ctx.drawImage(img, x, y, newWidth, newHeight);
      saveCanvasState(drawCanvas, shirtCanvas, 'Add Image', null);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Load design from file
document.getElementById('loadDesignInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) {
    console.log(`[${new Date().toISOString()}] No file selected for loading`);
    return;
  }

  const validTypes = ['image/png'];
  if (!validTypes.includes(file.type)) {
    console.log(`[${new Date().toISOString()}] Invalid file type for loading: ${file.type}`);
    alert('Please load a PNG file saved from this editor.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      console.log(`[${new Date().toISOString()}] Loading image onto canvas`);
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      saveCanvasState(drawCanvas, shirtCanvas, 'Load Design', null);
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

// PDF export and email buttons
document.getElementById('downloadPDFButton').addEventListener('click', () => {
  exportToPDF();
});

document.getElementById('sendEmailButton').addEventListener('click', () => {
  sendEmail();
});

// New Shirt button
document.getElementById('newShirtButton').addEventListener('click', () => {
  resetShirt();
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
      console.log(`[${new Date().toISOString()}] Selected tool: ${toolName}`);
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
    el.addEventListener('mousedown', () => {
      console.log(`[${new Date().toISOString()}] Button pressed for effect: ${effect}`);
      transferDesignToShirt(effect);
    });
    el.addEventListener('mouseup', () => {
      console.log(`[${new Date().toISOString()}] Button released for effect: ${effect}`);
      stopEffect();
    });
    el.addEventListener('mouseleave', () => {
      console.log(`[${new Date().toISOString()}] Mouse left button for effect: ${effect}`);
      stopEffect();
    });
  }
});

// Clear canvas
document.getElementById('clearButton').addEventListener('click', () => {
  console.log(`[${new Date().toISOString()}] Clearing canvas`);
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  saveCanvasState(drawCanvas, shirtCanvas, 'Clear Canvas', null);
});

// Canvas events
drawCanvas.addEventListener('mousedown', (e) => {
  drawing = true;
  console.log(`[${new Date().toISOString()}] Mouse down on canvas at x: ${e.offsetX}, y: ${e.offsetY}`);
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
    console.log(`[${new Date().toISOString()}] Mouse up on canvas at x: ${e.offsetX}, y: ${e.offsetY}`);
    currentTool?.onMouseUp(e);
    if (currentTool) {
      const action = currentTool === tools.text ? 'Add Text' : 'Draw';
      saveCanvasState(drawCanvas, shirtCanvas, action, currentTool.constructor.name);
    }
  }
});

drawCanvas.addEventListener('mouseleave', (e) => {
  if (drawing) {
    drawing = false;
    console.log(`[${new Date().toISOString()}] Mouse left canvas`);
    currentTool?.onMouseUp(e);
    if (currentTool) {
      const action = currentTool === tools.text ? 'Add Text' : 'Draw';
      saveCanvasState(drawCanvas, shirtCanvas, action, currentTool.constructor.name);
    }
  }
  drawCanvas.style.cursor = currentTool === tools.text ? 'text' : 'default';
});

// Keyboard shortcuts for undo/redo
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    console.log(`[${new Date().toISOString()}] Undo triggered`);
    undo(ctx, canvasWidth, canvasHeight, shirtCtx, shirtCanvasWidth, shirtCanvasHeight);
  } else if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    console.log(`[${new Date().toISOString()}] Redo triggered`);
    redo(ctx, canvasWidth, canvasHeight, shirtCtx, shirtCanvasWidth, shirtCanvasHeight);
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
        console.log(`[${new Date().toISOString()}] Popstate undo step ${i + 1}/${steps}`);
        undo(ctx, canvasWidth, canvasHeight, shirtCtx, shirtCanvasWidth, shirtCanvasHeight);
      }
    } else if (targetIndex > currentIndex) {
      const steps = targetIndex - currentIndex;
      for (let i = 0; i < steps; i++) {
        console.log(`[${new Date().toISOString()}] Popstate redo step ${i + 1}/${steps}`);
        redo(ctx, canvasWidth, canvasHeight, shirtCtx, shirtCanvasWidth, shirtCanvasHeight);
      }
    }
    console.log(`[${new Date().toISOString()}] Popstate: Target index: ${targetIndex}, Current index: ${currentIndex}`);
  } else {
    console.log(`[${new Date().toISOString()}] Popstate: No state to restore`);
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
saveCanvasState(drawCanvas, shirtCanvas, 'Initial State', null);