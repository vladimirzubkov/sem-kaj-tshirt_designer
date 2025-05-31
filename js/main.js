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

// Tool selection
document.querySelectorAll('.tool-icon').forEach(el => {
  el.addEventListener('click', () => {
    const toolName = el.dataset.tool;
    if (toolName && tools[toolName]) {
      currentTool = tools[toolName];
      // Sync color with current tool
      if (currentTool && currentTool !== tools.eraser && currentTool !== tools.water) {
        currentTool.setColor(colorPicker.value);
      }
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

currentTool = tools.pencil;