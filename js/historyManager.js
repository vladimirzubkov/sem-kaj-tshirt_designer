// historyManager.js

import { logger } from './logger.js';
import { createOptimizedContext } from './effectManager.js';

let history = [];
let redoStack = [];
let currentIndex = -1;
let lastSavedDescription = null; // Track last saved description
let lastSavedTime = 0; // Track last saved timestamp

// Save canvas state with deduplication
export function saveCanvasState(drawCanvas, shirtCanvas, description, stateIndex = null) {
  const now = Date.now();
  // Ignore duplicate descriptions within 100ms
  if (description === lastSavedDescription && now - lastSavedTime < 100) {
    logger.debug(`[${new Date().toISOString()}] Ignored duplicate state within 100ms: ${description}`);
    return;
  }

  // Create temporary offscreen canvases to avoid context caching issues
  const tempDrawCanvas = document.createElement('canvas');
  tempDrawCanvas.width = drawCanvas.width;
  tempDrawCanvas.height = drawCanvas.height;
  const tempDrawCtx = tempDrawCanvas.getContext('2d', { willReadFrequently: true });
  tempDrawCtx.drawImage(drawCanvas, 0, 0);

  const tempShirtCanvas = document.createElement('canvas');
  tempShirtCanvas.width = shirtCanvas.width;
  tempShirtCanvas.height = shirtCanvas.height;
  const tempShirtCtx = tempShirtCanvas.getContext('2d', { willReadFrequently: true });
  tempShirtCtx.drawImage(shirtCanvas, 0, 0);

  logger.debug(`[${new Date().toISOString()}] saveCanvasState: tempDrawCtx created for ${description}`);
  logger.debug(`[${new Date().toISOString()}] saveCanvasState: tempShirtCtx created for ${description}`);

  const drawData = tempDrawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
  const shirtData = tempShirtCtx.getImageData(0, 0, shirtCanvas.width, shirtCanvas.height);

  // Check if the new state is identical to the current state
  if (currentIndex >= 0) {
    const currentState = history[currentIndex];
    const isDrawIdentical = arraysEqual(currentState.drawData.data, drawData.data);
    const isShirtIdentical = arraysEqual(currentState.shirtData.data, shirtData.data);
    if (isDrawIdentical && isShirtIdentical) {
      logger.debug(`[${new Date().toISOString()}] Skipped saving duplicate state: ${description}`);
      return;
    }
  }

  // Prevent multiple effect states for the same effect
  if (description.startsWith('Transfer Design to Shirt') && currentIndex >= 0) {
    const lastState = history[currentIndex];
    if (lastState.description.startsWith('Transfer Design to Shirt') && now - Date.parse(lastState.timestamp) < 1000) {
      logger.debug(`[${new Date().toISOString()}] Ignored rapid effect state: ${description}`);
      return;
    }
  }

  const state = {
    drawData,
    shirtData,
    description,
    timestamp: new Date().toISOString()
  };

  // If stateIndex is provided (e.g., from popstate), insert at that index
  if (stateIndex !== null && stateIndex <= currentIndex) {
    history = history.slice(0, stateIndex + 1);
    currentIndex = stateIndex;
  } else {
    // Truncate history after current index
    history = history.slice(0, currentIndex + 1);
    currentIndex++;
  }

  history.push(state);
  redoStack = []; // Clear redo stack on new action
  lastSavedDescription = description;
  lastSavedTime = now;
  logger.info(`[${new Date().toISOString()}] Saved state: ${description}, History length: ${history.length}, Redo length: ${redoStack.length}`);

  // Update browser history
  const url = `${window.location.pathname}#${encodeURIComponent(description)}`;
  window.history.pushState({ stateIndex: currentIndex }, description, url);
}

// Helper function to compare array buffers
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Undo action
export function undo(drawCtx, drawWidth, drawHeight, shirtCtx, shirtWidth, shirtHeight) {
  if (currentIndex > 0) {
    currentIndex--;
    const state = history[currentIndex];
    drawCtx.putImageData(state.drawData, 0, 0);
    shirtCtx.putImageData(state.shirtData, 0, 0);
    logger.info(`[${new Date().toISOString()}] Undo to state: ${state.description}`);
    redoStack.push(history[currentIndex + 1]);
    window.history.pushState({ stateIndex: currentIndex }, state.description, `${window.location.pathname}#${encodeURIComponent(state.description)}`);
  } else {
    logger.debug(`[${new Date().toISOString()}] No more states to undo`);
  }
}

// Redo action
export function redo(drawCtx, drawWidth, drawHeight, shirtCtx, shirtWidth, shirtHeight) {
  if (redoStack.length > 0) {
    const state = redoStack.pop();
    currentIndex++;
    history[currentIndex] = state;
    drawCtx.putImageData(state.drawData, 0, 0);
    shirtCtx.putImageData(state.shirtData, 0, 0);
    logger.info(`[${new Date().toISOString()}] Redo to state: ${state.description}`);
    window.history.pushState({ stateIndex: currentIndex }, state.description, `${window.location.pathname}#${encodeURIComponent(state.description)}`);
  } else {
    logger.debug(`[${new Date().toISOString()}] No more states to redo`);
  }
}

// Get current history index
export function getCurrentHistoryIndex() {
  return currentIndex;
}

// Initialize history events
export function initHistoryEvents(drawCanvas, shirtCanvas) {
  logger.info(`[${new Date().toISOString()}] History events initialized for drawCanvas and shirtCanvas`);
}