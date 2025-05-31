// js/main.js

import { Pencil, Brush, Eraser, Water, TextTool } from './tools.js';

const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let currentTool = null;

const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.value = '#000000';
colorPicker.title = 'Color';
colorPicker.style.margin = '0 10px';
colorPicker.style.alignSelf = 'center';

const toolsBar = document.querySelector('.tools-bar');
const completeButton = toolsBar.querySelector('button');
toolsBar.insertBefore(colorPicker, completeButton);

const tools = {
  pencil: new Pencil(ctx),
  brush: new Brush(ctx),
  eraser: new Eraser(ctx),
  water: new Water(ctx),
  text: new TextTool(ctx)
};

// Update tool color on color picker change
colorPicker.addEventListener('input', () => {
  if (currentTool && currentTool !== tools.eraser && currentTool !== tools.water) {
    currentTool.setColor(colorPicker.value);
  }
});

// Function to position size value above slider thumb
function positionSizeValue(size) {
  const percentage = (size - sizeSlider.min) / (sizeSlider.max - sizeSlider.min);
  const thumbWidth = 16; // Approximate thumb width
  const trackWidth = sizeSlider.offsetWidth - thumbWidth;
  const leftPosition = percentage * trackWidth + thumbWidth / 2 + 1; // Shift 1px to the right
  sizeValue.style.left = `${leftPosition}px`;
}

// Update tool size on slider change
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
sizeSlider.addEventListener('input', () => {
  const size = parseInt(sizeSlider.value);
  sizeValue.textContent = size;
  positionSizeValue(size);
  if (currentTool) {
    currentTool.setSize(size);
  }
});

// Tool selection
document.querySelectorAll('.tool-icon').forEach(el => {
  el.addEventListener('click', () => {
    const toolName = el.dataset.tool;
    if (toolName && tools[toolName]) {
      currentTool = tools[toolName];
      // Sync color and size with current tool
      if (currentTool && currentTool !== tools.eraser && currentTool !== tools.water) {
        currentTool.setColor(colorPicker.value);
      }
      const size = parseInt(sizeSlider.value);
      currentTool.setSize(size);
      sizeValue.textContent = size;
      positionSizeValue(size);
    }
  });
});

// Clear canvas
document.getElementById('clearButton').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Canvas events
canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  currentTool?.onMouseDown(e);
});

canvas.addEventListener('mousemove', (e) => {
  if (drawing) currentTool?.onMouseMove(e);
});

canvas.addEventListener('mouseup', (e) => {
  drawing = false;
  currentTool?.onMouseUp(e);
});

canvas.addEventListener('mouseleave', (e) => {
  drawing = false;
  currentTool?.onMouseUp(e);
});

// Initialize size value position
const initialSize = parseInt(sizeSlider.value);
sizeValue.textContent = initialSize;
positionSizeValue(initialSize);

currentTool = tools.pencil;