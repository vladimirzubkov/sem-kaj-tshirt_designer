// js/historyManager.js

// History for undo/redo
let historyStates = [];
let redoStates = [];

// Save canvas state to history with tool information
export function saveCanvasState(canvas, action, toolName) {
  const state = canvas.toDataURL();
  historyStates.push({ state, action, toolName });
  redoStates = []; // Clear redo stack on new action
  // Add to browser history with descriptive message
  const historyMessage = toolName ? `${action} with ${toolName}` : action;
  window.history.pushState({ stateIndex: historyStates.length - 1 }, historyMessage, `#${historyMessage.replace(/\s+/g, '-')}`);
  // Update document title to reflect the action and tool
  document.title = `T-Shirt Editor | ${historyMessage}`;
  console.log(`Saved state: ${historyMessage}, History length: ${historyStates.length}, Redo length: ${redoStates.length}`);
}

// Restore canvas state
function restoreCanvasState(ctx, canvasWidth, canvasHeight, state) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0);
    console.log('Restored canvas state');
  };
  img.onerror = () => {
    console.error('Failed to restore canvas state');
  };
  img.src = state;
}

// Undo action
export function undo(ctx, canvasWidth, canvasHeight) {
  if (historyStates.length <= 1) {
    console.log('Cannot undo: no more states to revert to');
    return; // Keep at least one state
  }
  const lastState = historyStates.pop();
  redoStates.push(lastState);
  const previousState = historyStates[historyStates.length - 1];
  restoreCanvasState(ctx, canvasWidth, canvasHeight, previousState.state);
  // Update document title to reflect the undone state
  const historyMessage = previousState.toolName ? `${previousState.action} with ${previousState.toolName}` : previousState.action;
  document.title = `T-Shirt Editor | ${historyMessage}`;
  console.log(`Undo: History length: ${historyStates.length}, Redo length: ${redoStates.length}`);
}

// Redo action
export function redo(ctx, canvasWidth, canvasHeight) {
  if (redoStates.length === 0) {
    console.log('Cannot redo: no states to redo');
    return;
  }
  const nextState = redoStates.pop();
  historyStates.push(nextState);
  restoreCanvasState(ctx, canvasWidth, canvasHeight, nextState.state);
  // Update document title to reflect the redone state
  const historyMessage = nextState.toolName ? `${nextState.action} with ${nextState.toolName}` : nextState.action;
  document.title = `T-Shirt Editor | ${historyMessage}`;
  console.log(`Redo: History length: ${historyStates.length}, Redo length: ${redoStates.length}`);
}

// Get current history index for popstate handling
export function getCurrentHistoryIndex() {
  return historyStates.length - 1;
}

// Get history states length for popstate handling
export function getHistoryStatesLength() {
  return historyStates.length;
}

// Get redo states length for popstate handling
export function getRedoStatesLength() {
  return redoStates.length;
}