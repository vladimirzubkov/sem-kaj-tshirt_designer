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

// Tool selection with highlighting
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

// Set initial tool (Pencil) as selected
document.querySelector('.tool-icon[data-tool="pencil"]').classList.add('selected');
currentTool = tools.pencil;