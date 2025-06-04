// canvasManager.js

import { saveCanvasState } from './historyManager.js';
import { logger } from './logger.js';

export function initCanvasEvents(drawCanvas, shirtCanvas, tools) {
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  drawCanvas.addEventListener('mousedown', (e) => {
    if (!tools.currentTool) {
      logger.warn(`[${new Date().toISOString()}] No tool selected on mousedown`);
      return;
    }
    isDrawing = true;
    const rect = drawCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    logger.debug(`[${new Date().toISOString()}] Mousedown at x: ${lastX}, y: ${lastY}, tool: ${tools.currentTool.constructor.name}`);
    tools.currentTool.onMouseDown(lastX, lastY);
  });

  drawCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || !tools.currentTool) return;
    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    logger.debug(`[${new Date().toISOString()}] Mousemove at x: ${x}, y: ${y}, tool: ${tools.currentTool.constructor.name}`);
    tools.currentTool.onMouseMove(x, y);
    lastX = x;
    lastY = y;
  });

  drawCanvas.addEventListener('mouseup', () => {
    if (isDrawing && tools.currentTool) {
      isDrawing = false;
      logger.info(`[${new Date().toISOString()}] Mouseup, drawing ended with ${tools.currentTool.constructor.name}`);
      tools.currentTool.onMouseUp();
      saveCanvasState(drawCanvas, shirtCanvas, `Draw with ${tools.currentTool.constructor.name.toLowerCase()}`, null);
    }
  });

  drawCanvas.addEventListener('mouseleave', () => {
    if (isDrawing && tools.currentTool) {
      isDrawing = false;
      logger.info(`[${new Date().toISOString()}] Mouseleave, drawing ended with ${tools.currentTool.constructor.name}`);
      tools.currentTool.onMouseUp();
      saveCanvasState(drawCanvas, shirtCanvas, `Draw with ${tools.currentTool.constructor.name.toLowerCase()}`, null);
    }
  });

  // Handle drag-and-drop
  drawCanvas.addEventListener('dragenter', (e) => {
    e.preventDefault();
    drawCanvas.classList.add('drag-active');
    logger.debug(`[${new Date().toISOString()}] dragenter canvas`);
  });

  drawCanvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    drawCanvas.classList.add('drag-active');
    logger.debug(`[${new Date().toISOString()}] dragover canvas`);
  });

  drawCanvas.addEventListener('dragleave', (e) => {
    e.preventDefault();
    drawCanvas.classList.remove('drag-active');
    logger.debug(`[${new Date().toISOString()}] dragleave canvas`);
  });

  drawCanvas.addEventListener('drop', (e) => {
    e.preventDefault();
    drawCanvas.classList.remove('drag-active');
    logger.info(`[${new Date().toISOString()}] Drop on canvas`);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const ctx = drawCanvas.getContext('2d');
            const scale = Math.min(drawCanvas.width / img.width, drawCanvas.height / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const x = (drawCanvas.width - scaledWidth) / 2;
            const y = (drawCanvas.height - scaledHeight) / 2;
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            logger.info(`[${new Date().toISOString()}] Drawing image at x: ${x}, y: ${y}, width: ${scaledWidth}, height: ${scaledHeight}`);
            saveCanvasState(drawCanvas, shirtCanvas, 'Add Image', null);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  });
}