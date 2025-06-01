// js/historyManager.js

// History for undo/redo
let historyStates = [];
let redoStates = [];

// Save canvas state to history with tool information
export function saveCanvasState(drawCanvas, shirtCanvas, action, toolName) {
  const drawState = drawCanvas.toDataURL();
  const shirtState = shirtCanvas.toDataURL();
  historyStates.push({ drawState, shirtState, action, toolName });
  redoStates = []; // Clear redo stack on new action
  // Add to browser history with descriptive message
  const historyMessage = toolName ? `${action} with ${toolName}` : action;
  window.history.pushState({ stateIndex: historyStates.length - 1 }, historyMessage, `#${historyMessage.replace(/\s+/g, '-')}`);
  // Update document title to reflect the action and tool
  document.title = `T-Shirt Editor | ${historyMessage}`;
  console.log(`Saved state: ${historyMessage}, History length: ${historyStates.length}, Redo length: ${redoStates.length}`);
}

// Restore canvas state
function restoreCanvasState(drawCtx, drawCanvasWidth, drawCanvasHeight, shirtCtx, shirtCanvasWidth, shirtCanvasHeight, state) {
  const drawImg = new Image();
  const shirtImg = new Image();
  
  let drawLoaded = false;
  let shirtLoaded = false;

  const checkBothLoaded = () => {
    if (drawLoaded && shirtLoaded) {
      console.log('Restored canvas state for both drawCanvas and shirtCanvas');
    }
  };

  drawImg.onload = () => {
    drawCtx.clearRect(0, 0, drawCanvasWidth, drawCanvasHeight);
    drawCtx.drawImage(drawImg, 0, 0);
    drawLoaded = true;
    checkBothLoaded();
  };
  drawImg.onerror = () => {
    console.error('Failed to restore drawCanvas state');
  };
  drawImg.src = state.drawState;

  shirtImg.onload = () => {
    shirtCtx.clearRect(0, 0, shirtCanvasWidth, shirtCanvasHeight);
    shirtCtx.drawImage(shirtImg, 0, 0);
    shirtLoaded = true;
    checkBothLoaded();
  };
  shirtImg.onerror = () => {
    console.error('Failed to restore shirtCanvas state');
  };
  shirtImg.src = state.shirtState;
}

// Undo action
export function undo(drawCtx, drawCanvasWidth, drawCanvasHeight, shirtCtx, shirtCanvasWidth, shirtCanvasHeight) {
  if (historyStates.length > 1) {
    const lastState = historyStates.pop();
    redoStates.push(lastState);
    const stateToRestore = historyStates[historyStates.length - 1];
    restoreCanvasState(drawCtx, drawCanvasWidth, drawCanvasHeight, shirtCtx, shirtCanvasWidth, shirtCanvasHeight, stateToRestore);
  } else {
    console.log('Nothing to undo');
  }
}

// Redo action
export function redo(drawCtx, drawCanvasWidth, drawCanvasHeight, shirtCtx, shirtCanvasWidth, shirtCanvasHeight) {
  if (redoStates.length > 0) {
    const stateToRestore = redoStates.pop();
    historyStates.push(stateToRestore);
    restoreCanvasState(drawCtx, drawCanvasWidth, drawCanvasHeight, shirtCtx, shirtCanvasWidth, shirtCanvasHeight, stateToRestore);
  } else {
    console.log('Nothing to redo');
  }
}

// Get current history index
export function getCurrentHistoryIndex() {
  return historyStates.length - 1;
}

// Get history states length
export function getHistoryStatesLength() {
  return historyStates.length;
}

// Get redo states length
export function getRedoStatesLength() {
  return redoStates.length;
}

// Initialize history events (placeholder)
export function initHistoryEvents(drawCanvas, shirtCanvas) {
  console.log(`[${new Date().toISOString()}] History events initialized for drawCanvas and shirtCanvas`);
  // Placeholder for future history event initialization
}