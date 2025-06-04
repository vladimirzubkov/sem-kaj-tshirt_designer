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
    const sliderValue = parseInt(domElements.sizeSlider.value);
    const size = computeNonLinearSize(sliderValue);
    updateSize(tools, size, drawCanvas, tools.currentTool?.constructor.name.toLowerCase());
  });

  // Initialize size value
  updateSize(tools, tools.pencil.size, drawCanvas, 'pencil'); // Use Pencil default size
  selectTool(tools, 'pencil', drawCanvas); // Set Pencil as default tool
}

export function selectTool(tools, toolName, drawCanvas) {
  logger.info(`[${new Date().toISOString()}] Selected tool: ${toolName}`);
  document.querySelectorAll('.tool-icon').forEach(icon => icon.classList.remove('selected'));
  const toolIcon = document.querySelector(`.tool-icon[data-tool="${toolName}"]`);
  if (toolIcon) toolIcon.classList.add('selected');
  tools.currentTool = tools[toolName];
  if (tools.currentTool) {
    const colorPicker = document.querySelector('input[type="color"]');
    if (toolName === 'brush') {
      // Use default brush color #E21212
      tools.currentTool.setColor('#E21212');
      colorPicker.value = '#E21212';
    } else if (toolName === 'pencil') {
      // Use default pencil color #1C2526
      tools.currentTool.setColor('#1C2526');
      colorPicker.value = '#1C2526';
    } else if (toolName === 'text') {
      // Use default text color #000000
      tools.currentTool.setColor('#000000');
      colorPicker.value = '#000000';
    } else if (tools.currentTool !== tools.eraser && tools.currentTool !== tools.water) {
      tools.currentTool.setColor(colorPicker.value);
    }
    // Set tool-specific default size
    const defaultSize = tools[toolName].size;
    updateSize(tools, defaultSize, drawCanvas, toolName);
    // Update slider to match default size
    const sliderValue = computeSliderValue(defaultSize);
    document.getElementById('sizeSlider').value = sliderValue;
    positionSizeValue(sliderValue);
  }
}

// Compute non-linear size based on slider value (0-100) using geometric progression
function computeNonLinearSize(sliderValue) {
  const q = 0.9999967; // Geometric progression ratio
  const n = sliderValue; // Slider value as number of steps
  if (n === 0) return 1; // Minimum size
  const size = (1 - Math.pow(q, n)) / (1 - q); // Geometric series sum
  return Math.round(size);
}

// Compute slider value for a given size (inverse of computeNonLinearSize)
function computeSliderValue(size) {
  const q = 0.9999967;
  if (size <= 1) return 0;
  // Solve: size = (1 - q^n) / (1 - q) => q^n = 1 - size * (1 - q)
  const n = Math.log(1 - size * (1 - q)) / Math.log(q);
  return Math.max(0, Math.min(100, Math.round(n)));
}

function updateSize(tools, size, drawCanvas, toolName) {
  const sizeValue = document.getElementById('sizeValue');
  sizeValue.textContent = size;
  positionSizeValue(computeSliderValue(size));
  if (tools.currentTool) {
    tools.currentTool.setSize(size);
    logger.info(`[${new Date().toISOString()}] Size updated to ${size} for tool ${tools.currentTool.constructor.name}`);
    const cursorColor = size >= 128 ? '#FF0000' : '#000000';
    const isTextTool = toolName === 'text';
    drawCanvas.style.cursor = isTextTool ? generateTextCursor(size, cursorColor) : generateDrawingCursor(size, cursorColor);
  }
}

function positionSizeValue(sliderValue) {
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeValue = document.getElementById('sizeValue');
  const percentage = sliderValue / 100; // Linear percentage
  const thumbWidth = 16;
  const trackWidth = sizeSlider.offsetWidth - thumbWidth;
  const leftPosition = percentage * trackWidth + thumbWidth / 2 + 1;
  sizeValue.style.left = `${leftPosition}px`;
}
