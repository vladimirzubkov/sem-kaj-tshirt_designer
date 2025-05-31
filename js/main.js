// js/main.js

import { Pencil, Brush, Eraser, Water, TextTool } from './tools.js';

const drawCanvas = document.getElementById('drawCanvas');
const ctx = drawCanvas.getContext('2d');
let drawing = false;
let currentTool = null;

// Canvas dimensions
const canvasWidth = drawCanvas.width;
const canvasHeight = drawCanvas.height;

// Function to generate a custom cursor SVG for drawing tools (circle)
function generateDrawingCursor(size, color = '#000000') {
  // Limit cursor size to 128px (browser restriction), but scale visually
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
  // Adjust cursor height to match text height (font-size * 0.75 for sans-serif)
  const maxCursorSize = 128;
  const scale = size > maxCursorSize ? maxCursorSize / size : 1;
  const cursorHeight = Math.min(size * 0.75, maxCursorSize);
  const width = 10 * scale;
  const height = cursorHeight;
  const serifLength = Math.min(size * 0.15, maxCursorSize * 0.15); // Proportional serif length
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <!-- Vertical line -->
      <line x1="${width / 2}" y1="0" x2="${width / 2}" y2="${height}" stroke="${color}" stroke-width="2"/>
      <!-- Top serif -->
      <line x1="${width / 2 - serifLength}" y1="0" x2="${width / 2 + serifLength}" y2="0" stroke="${color}" stroke-width="2"/>
      <!-- Bottom serif -->
      <line x1="${width / 2 - serifLength}" y1="${height}" x2="${width / 2 + serifLength}" y2="${height}" stroke="${color}" stroke-width="2"/>
    </svg>
  `;
  // Align cursor so the bottom edge matches the text baseline
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
        // Determine scaling factor based on larger dimension
        const aspectRatio = img.width / img.height;
        if (img.width > img.height) {
          newWidth = canvasWidth;
          newHeight = newWidth / aspectRatio;
        } else {
          newHeight = canvasHeight;
          newWidth = newHeight * aspectRatio;
        }
        // Center the image
        x = (canvasWidth - newWidth) / 2;
        y = (canvasHeight - newHeight) / 2;
      }

      // Draw image on canvas
      ctx.drawImage(img, x, y, newWidth, newHeight);
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
    // Determine cursor color based on size
    const cursorColor = size >= 128 ? '#FF0000' : '#000000';
    // Update cursor based on tool
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

      // Determine cursor color based on size
      const cursorColor = size >= 128 ? '#FF0000' : '#000000';
      // Set cursor style based on tool
      drawCanvas.style.cursor = toolName === 'text' ? generateTextCursor(size, cursorColor) : generateDrawingCursor(size, cursorColor);
    }
  });
});

// Clear canvas
document.getElementById('clearButton').addEventListener('click', () => {
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
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
  // Restore custom cursor on mousemove if the tool is active
  if (currentTool) {
    const size = parseInt(sizeSlider.value);
    const cursorColor = size >= 128 ? '#FF0000' : '#000000';
    drawCanvas.style.cursor = currentTool === tools.text ? generateTextCursor(size, cursorColor) : generateDrawingCursor(size, cursorColor);
  }
});

drawCanvas.addEventListener('mouseup', (e) => {
  drawing = false;
  currentTool?.onMouseUp(e);
});

drawCanvas.addEventListener('mouseleave', (e) => {
  drawing = false;
  currentTool?.onMouseUp(e);
  drawCanvas.style.cursor = currentTool === tools.text ? 'text' : 'default';
});

// Initialize size value position
const initialSize = parseInt(sizeSlider.value);
sizeValue.textContent = initialSize;
positionSizeValue(initialSize);

// Set initial tool (Pencil) as selected
document.querySelector('.tool-icon[data-tool="pencil"]').classList.add('selected');
currentTool = tools.pencil;
drawCanvas.style.cursor = generateDrawingCursor(initialSize);