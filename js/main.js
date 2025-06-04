// main.js
import { Pencil, Brush, Eraser, Water, TextTool } from './tools.js';
import { saveCanvasState, undo, redo, getCurrentHistoryIndex } from './historyManager.js';
import { showProgress, hideProgress } from './progressManager.js';
import { saveProject, loadProject, exportToPDF } from './projectManager.js';
import { initCanvasEvents } from './canvasManager.js';
import { initUI } from './uiManager.js';
import { getCurrentShirtCanvas } from './shirtCanvasManager.js';
import { initOrderForm, openOrderModal } from './orderForm.js';
import { logger } from './logger.js';

const { jsPDF } = window.jspdf;

const drawCanvas = document.getElementById('drawCanvas');
const progressBar = document.getElementById('effectProgress');
const ctx = drawCanvas.getContext('2d');

const shirtCanvas = getCurrentShirtCanvas();
logger.info(`[${new Date().toISOString()}] shirtCanvas visibility: visibility=${shirtCanvas.style.visibility}, display=${window.getComputedStyle(shirtCanvas).display}, zIndex=${window.getComputedStyle(shirtCanvas).zIndex}`);
logger.info(`[${new Date().toISOString()}] drawCanvas visibility: visibility=${drawCanvas.style.visibility}, display=${window.getComputedStyle(drawCanvas).display}, zIndex=${window.getComputedStyle(drawCanvas).zIndex}`);

function resetShirt() {
  logger.info(`[${new Date().toISOString()}] Resetting shirt`);
  const shirtCanvas = getCurrentShirtCanvas();
  const shirtCtx = shirtCanvas.getContext('2d');
  shirtCtx.clearRect(0, 0, shirtCanvas.width, shirtCanvas.height);
  saveCanvasState(drawCanvas, shirtCanvas, 'Reset Shirt', null);
}

const toolClasses = [Pencil, Brush, Eraser, Water, TextTool];
const tools = { currentTool: null };
toolClasses.forEach(ToolClass => {
  tools[ToolClass.name] = new ToolClass(ctx);
});

initUI(tools, drawCanvas, shirtCanvas);
initOrderForm();

// Keep saveDesignButton for future functionality
// document.getElementById('saveDesignButton').addEventListener('click', () => {
//   const shirtCanvas = getCurrentShirtCanvas();
//   saveDesign(drawCanvas, shirtCanvas);
// });

document.getElementById('saveProjectButton').addEventListener('click', () => {
  saveProject(drawCanvas);
});

document.getElementById('loadProjectButton').addEventListener('click', () => {
  loadProject(drawCanvas, () => {
    // Callback to refresh UI after project load
    initUI(tools, drawCanvas, getCurrentShirtCanvas());
  });
});

document.getElementById('downloadPDFButton').addEventListener('click', () => {
  const shirtCanvas = getCurrentShirtCanvas();
  exportToPDF(drawCanvas, shirtCanvas, false); // Save PDF
});

document.getElementById('newShirtButton').addEventListener('click', () => {
  resetShirt();
});

document.getElementById('clearButton').addEventListener('click', () => {
  logger.info(`[${new Date().toISOString()}] Clearing canvas`);
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  const shirtCanvas = getCurrentShirtCanvas();
  saveCanvasState(drawCanvas, shirtCanvas, 'Clear Canvas', null);
});

document.getElementById('orderForm').addEventListener('click', () => {
  logger.debug(`[${new Date().toISOString()}] Order form button clicked`);
  openOrderModal();
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    logger.info(`[${new Date().toISOString()}] Undo triggered`);
    const shirtCanvas = getCurrentShirtCanvas();
    const shirtCtx = shirtCanvas.getContext('2d');
    undo(ctx, drawCanvas.width, drawCanvas.height, shirtCtx, shirtCanvas.width, shirtCanvas.height);
  } else if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    logger.info(`[${new Date().toISOString()}] Redo triggered`);
    const shirtCanvas = getCurrentShirtCanvas();
    const shirtCtx = shirtCanvas.getContext('2d');
    redo(ctx, drawCanvas.width, drawCanvas.height, shirtCtx, shirtCanvas.width, shirtCanvas.height);
  }
}, { capture: true });

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.stateIndex !== undefined) {
    const targetIndex = e.state.stateIndex;
    const currentIndex = getCurrentHistoryIndex();

    const shirtCanvas = getCurrentShirtCanvas();
    const shirtCtx = shirtCanvas.getContext('2d');

    if (targetIndex < currentIndex) {
      const steps = currentIndex - targetIndex;
      for (let i = 0; i < steps; i++) {
        logger.info(`[${new Date().toISOString()}] Popstate undo step ${i + 1}/${steps}`);
        undo(ctx, drawCanvas.width, drawCanvas.height, shirtCtx, shirtCanvas.width, shirtCanvas.height);
      }
    } else if (targetIndex > currentIndex) {
      const steps = targetIndex - currentIndex;
      for (let i = 0; i < steps; i++) {
        logger.info(`[${new Date().toISOString()}] Popstate redo step ${i + 1}/${steps}`);
        redo(ctx, drawCanvas.width, drawCanvas.height, shirtCtx, shirtCanvas.width, shirtCanvas.height);
      }
    }
    logger.info(`[${new Date().toISOString()}] Popstate: Target index: ${targetIndex}, Current index: ${currentIndex}`);
  } else {
    logger.info(`[${new Date().toISOString()}] Popstate: No state to restore`);
  }
});

initCanvasEvents(drawCanvas, getCurrentShirtCanvas(), tools);

saveCanvasState(drawCanvas, getCurrentShirtCanvas(), 'Initial State', null);