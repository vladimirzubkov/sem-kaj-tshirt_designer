// js/canvasManager.js

  import { initHistoryEvents } from './historyManager.js';

  // Initialize canvas events
  export function initCanvasEvents(drawCanvas, shirtCanvas, tools) {
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Mouse events for drawing
    drawCanvas.addEventListener('mousedown', (e) => {
      if (!tools.currentTool) return;
      isDrawing = true;
      const rect = drawCanvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      // Use onMouseDown or start, depending on tools.js
      if (typeof tools.currentTool.onMouseDown === 'function') {
        tools.currentTool.onMouseDown(lastX, lastY);
      } else if (typeof tools.currentTool.start === 'function') {
        tools.currentTool.start(lastX, lastY);
      }
      console.log(`[${new Date().toISOString()}] Mousedown at x: ${lastX}, y: ${lastY}`);
    });

    drawCanvas.addEventListener('mousemove', (e) => {
      if (!isDrawing || !tools.currentTool) return;
      const rect = drawCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Use onMouseMove or move
      if (typeof tools.currentTool.onMouseMove === 'function') {
        tools.currentTool.onMouseMove(x, y, lastX, lastY);
      } else if (typeof tools.currentTool.move === 'function') {
        tools.currentTool.move(x, y, lastX, lastY);
      }
      lastX = x;
      lastY = y;
      console.log(`[${new Date().toISOString()}] Mousemove at x: ${x}, y: ${y}`);
    });

    drawCanvas.addEventListener('mouseup', () => {
      if (isDrawing && tools.currentTool) {
        isDrawing = false;
        // Use onMouseUp or end
        if (typeof tools.currentTool.onMouseUp === 'function') {
          tools.currentTool.onMouseUp();
        } else if (typeof tools.currentTool.end === 'function') {
          tools.currentTool.end();
        }
        saveCanvasState(drawCanvas, shirtCanvas, 'Draw', tools.currentTool.constructor.name);
        console.log(`[${new Date().toISOString()}] Mouseup, drawing ended`);
      }
    });

    drawCanvas.addEventListener('mouseleave', () => {
      if (isDrawing && tools.currentTool) {
        isDrawing = false;
        // Use onMouseUp or end
        if (typeof tools.currentTool.onMouseUp === 'function') {
          tools.currentTool.onMouseUp();
        } else if (typeof tools.currentTool.end === 'function') {
          tools.currentTool.end();
        }
        saveCanvasState(drawCanvas, shirtCanvas, 'Draw', tools.currentTool.constructor.name);
        console.log(`[${new Date().toISOString()}] Mouseleave, drawing ended`);
      }
    });

    // Drag-and-drop events
    drawCanvas.addEventListener('dragenter', (e) => {
      e.preventDefault();
      drawCanvas.style.border = '2px solid black'; // Highlight canvas
      console.log(`[${new Date().toISOString()}] dragenter canvas`);
    });

    drawCanvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      console.log(`[${new Date().toISOString()}] dragover canvas`);
    });

    drawCanvas.addEventListener('dragleave', () => {
      drawCanvas.style.border = ''; // Remove highlight
      console.log(`[${new Date().toISOString()}] dragleave canvas`);
    });

    drawCanvas.addEventListener('drop', (e) => {
      e.preventDefault();
      drawCanvas.style.border = ''; // Remove highlight
      console.log(`[${new Date().toISOString()}] Drop on canvas`);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const ctx = drawCanvas.getContext('2d');
            const canvasWidth = drawCanvas.width; // 375
            const canvasHeight = drawCanvas.height; // 500
            // Scale image to fit canvas by larger side
            let scale = 1;
            if (img.width > img.height) {
              scale = canvasWidth / img.width;
            } else {
              scale = canvasHeight / img.height;
            }
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            // Center image on canvas
            const x = (canvasWidth - scaledWidth) / 2;
            const y = (canvasHeight - scaledHeight) / 2;
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            saveCanvasState(drawCanvas, shirtCanvas, 'Add Image', null);
            console.log(`[${new Date().toISOString()}] Drawing image at x: ${x}, y: ${y}, width: ${scaledWidth}, height: ${scaledHeight}`);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Initialize history events
    initHistoryEvents(drawCanvas, shirtCanvas);
  }

  // Save canvas state (proxy to historyManager.js)
  export function saveCanvasState(drawCanvas, shirtCanvas, action, toolName) {
    import('./historyManager.js').then(module => {
      module.saveCanvasState(drawCanvas, shirtCanvas, action, toolName);
    });
  }