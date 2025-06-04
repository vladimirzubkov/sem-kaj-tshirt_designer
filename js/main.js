// main.js
import { Pencil, Brush, Eraser, Water, TextTool } from './tools.js';
import { saveCanvasState, undo, redo, getCurrentHistoryIndex } from './historyManager.js';
import { showProgress, hideProgress } from './progressManager.js';
import { saveProject, loadProject, exportToPDF, exportToPNG } from './projectManager.js';
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

// Load saved PNG from localStorage on page load
function loadSavedPNG() {
  const savedPNG = localStorage.getItem('tshirtDesignPNG');
  if (savedPNG) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      ctx.drawImage(img, 0, 0, drawCanvas.width, drawCanvas.height);
      logger.info(`[${new Date().toISOString()}] Loaded saved PNG to drawCanvas from localStorage`);
      saveCanvasState(drawCanvas, shirtCanvas, 'Load Saved PNG to Draw Canvas', null);
    };
    img.onerror = () => {
      logger.error(`[${new Date().toISOString()}] Failed to load saved PNG from localStorage`);
    };
    img.src = savedPNG;
  } else {
    logger.debug(`[${new Date().toISOString()}] No saved PNG found in localStorage`);
  }
}

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
loadSavedPNG(); // Load saved PNG after initialization

document.getElementById('saveDesignButton').addEventListener('click', () => {
  exportToPNG(drawCanvas); // Export PNG from drawCanvas and save to localStorage
});

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
  logger.info(`[${new Date().toISOString()}] Clearing canvas and localStorage`);
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  localStorage.removeItem('tshirtDesignPNG');
  logger.info(`[${new Date().toISOString()}] Removed tshirtDesignPNG from localStorage`);
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
        logger.info(`[${new Date().toISOString()}] Popstate undo steps ${i + 1}/${steps}`);
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