// toolManager.js
import { generateDrawingCursor, generateTextCursor } from './cursorManager.js';
import { logger } from './logger.js';

export function initToolManager(tools, drawCanvas, domElements) {
  // Set tool labels dynamically
  document.querySelectorAll('[data-tool-label]').forEach(label => {
    const toolName = label.dataset.toolLabel;
    const tool = tools[toolName];
    if (tool) {
      label.textContent = tool.constructor.displayName || toolName;
    }
  });

  // Tool selection
  document.querySelectorAll('.tool-icon').forEach(el => {
    const toolName = el.dataset.tool;
    if (toolName && tools[toolName]) {
      logger.debug(`[${new Date().toISOString()}] Binding tool: ${toolName}`);
      el.addEventListener('click', () => selectTool(tools, toolName, drawCanvas));
    }
  });

  // Size slider change
  domElements.sizeSlider.addEventListener('input', () => {
    const size = parseInt(domElements.sizeSlider.value);
    updateSize(tools, size, drawCanvas, tools.currentTool?.constructor.name.toLowerCase());
  });

  // Initialize size value
  const initialSize = parseInt(domElements.sizeSlider.value);
  updateSize(tools, initialSize, drawCanvas, 'pencil');
}

export function selectTool(tools, toolName, drawCanvas) {
  logger.info(`[${new Date().toISOString()}] Selected tool: ${toolName}`);
  document.querySelectorAll('.tool-icon').forEach(icon => icon.classList.remove('selected'));
  const toolIcon = document.querySelector(`.tool-icon[data-tool="${toolName}"]`);
  if (toolIcon) toolIcon.classList.add('selected');
  tools.currentTool = tools[toolName];
  if (tools.currentTool && tools.currentTool !== tools.eraser && tools.currentTool !== tools.water) {
    const colorPicker = document.querySelector('input[type="color"]');
    tools.currentTool.setColor(colorPicker.value);
  }
  const sizeSlider = document.getElementById('sizeSlider');
  const size = parseInt(sizeSlider.value);
  updateSize(tools, size, drawCanvas, toolName);
}

function updateSize(tools, size, drawCanvas, toolName) {
  const sizeValue = document.getElementById('sizeValue');
  sizeValue.textContent = size;
  positionSizeValue(size);
  if (tools.currentTool) {
    tools.currentTool.setSize(size);
    logger.info(`[${new Date().toISOString()}] Size updated to ${size} for tool ${tools.currentTool.constructor.name}`);
    const cursorColor = size >= 128 ? '#FF0000' : '#000000';
    const isTextTool = toolName === 'text';
    drawCanvas.style.cursor = isTextTool ? generateTextCursor(size, cursorColor) : generateDrawingCursor(size, cursorColor);
  }
}

function positionSizeValue(size) {
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeValue = document.getElementById('sizeValue');
  const percentage = (size - sizeSlider.min) / (sizeSlider.max - sizeSlider.min);
  const thumbWidth = 16;
  const trackWidth = sizeSlider.offsetWidth - thumbWidth;
  const leftPosition = percentage * trackWidth + thumbWidth / 2 + 1;
  sizeValue.style.left = `${leftPosition}px`;
}