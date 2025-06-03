// projectManager.js

import { logger } from './logger.js';
import { saveCanvasState } from './historyManager.js';
import { getAllShirtCanvases, createShirtCanvas } from './shirtCanvasManager.js';
import { updateShirtColorOptions, updateBackgroundColorOptions, selectShirtColor, selectBackgroundColor } from './colorManager.js';
import { applySizeScaling } from './sizeManager.js';

// Access jsPDF from CDN
const { jsPDF } = window.jspdf;

// Save design as PNG
export function saveDesign(drawCanvas, shirtCanvas) {
  const link = document.createElement('a');
  link.download = 'shirt-design.png';
  link.href = shirtCanvas.toDataURL('image/png');
  link.click();
  logger.info(`[${new Date().toISOString()}] Design saved as PNG`);
  saveCanvasState(drawCanvas, shirtCanvas, 'Save Design', null);
}

// Load design from PNG
export function loadDesign(drawCanvas, shirtCanvas) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const ctx = shirtCanvas.getContext('2d');
          ctx.clearRect(0, 0, shirtCanvas.width, shirtCanvas.height);
          ctx.drawImage(img, 0, 0, shirtCanvas.width, shirtCanvas.height);
          logger.info(`[${new Date().toISOString()}] Design loaded from PNG`);
          saveCanvasState(drawCanvas, shirtCanvas, 'Load Design', null);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// Export design to PDF
export function exportToPDF(drawCanvas, shirtCanvas) {
  const doc = new jsPDF();
  const imgData = shirtCanvas.toDataURL('image/png');
  doc.addImage(imgData, 'PNG', 10, 10, 190, 190 * shirtCanvas.height / shirtCanvas.width);
  doc.save('shirt-design.pdf');
  logger.info(`[${new Date().toISOString()}] Design exported to PDF`);
  saveCanvasState(drawCanvas, shirtCanvas, 'Export to PDF', null);
}

// Send design via email
export function sendEmail(drawCanvas, shirtCanvas) {
  const imgData = shirtCanvas.toDataURL('image/png');
  const subject = encodeURIComponent('My Shirt Design');
  const body = encodeURIComponent('Here is my shirt design:\n\n');
  const mailtoLink = `mailto:?subject=${subject}&body=${body}%0D%0A${encodeURIComponent(imgData)}`;
  window.location.href = mailtoLink;
  logger.info(`[${new Date().toISOString()}] Email client opened with design`);
  saveCanvasState(drawCanvas, shirtCanvas, 'Send Email', null);
}

// Save project as JSON
export function saveProject(drawCanvas) {
  const fileName = prompt('Zadejte název souboru pro projekt (nechte prázdné pro výchozí):');
  let finalFileName = fileName ? `${fileName}.json` : getDefaultFileName();

  const shirtCanvases = getAllShirtCanvases();
  const projectData = {
    drawCanvas: drawCanvas.toDataURL('image/png'),
    styles: {}
  };

  // Save only non-empty styles
  ['man', 'woman', 'kid'].forEach(style => {
    const canvasData = shirtCanvases[style];
    if (canvasData && !canvasData.isEmpty) {
      projectData.styles[style] = {
        size: canvasData.size,
        shirtColor: canvasData.shirtColor,
        backgroundColor: canvasData.backgroundColor,
        customBackgroundColor: canvasData.customBackgroundColor,
        shirtCanvas: canvasData.shirtCanvas.toDataURL('image/png')
      };
      logger.debug(`[${new Date().toISOString()}] Uložen styl ${style} s neprázdným designem`);
    }
  });

  const jsonData = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFileName;
  link.click();
  URL.revokeObjectURL(url);

  logger.info(`[${new Date().toISOString()}] Projekt uložen jako JSON: ${finalFileName}`);
  saveCanvasState(drawCanvas, getCurrentShirtCanvas(), 'Uložit projekt', null);
}

// Load project from JSON
export function loadProject(drawCanvas, callback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const projectData = JSON.parse(event.target.result);
          restoreProject(drawCanvas, projectData, callback);
          logger.info(`[${new Date().toISOString()}] Projekt načten z JSON`);
        } catch (error) {
          logger.error(`[${new Date().toISOString()}] Nepodařilo se zpracovat JSON soubor projektu:`, error);
          alert('Neplatný formát souboru projektu.');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

// Helper to get default file name in format t-shirt-design-yymmdd-hh-mm.json
function getDefaultFileName() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `t-shirt-design-${year}${month}${day}-${hours}-${minutes}.json`;
}

// Helper to restore project data
function restoreProject(drawCanvas, projectData, callback) {
  const shirtCanvases = getAllShirtCanvases();
  const currentStyle = shirtCanvases.currentStyle;

  // Restore drawCanvas
  if (projectData.drawCanvas) {
    const img = new Image();
    img.onload = () => {
      const ctx = drawCanvas.getContext('2d');
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      ctx.drawImage(img, 0, 0);
      logger.debug(`[${new Date().toISOString()}] Obnoven drawCanvas`);

      // Restore styles
      Object.keys(projectData.styles).forEach(style => {
        const styleData = projectData.styles[style];
        if (!shirtCanvases[style]) {
          shirtCanvases[style] = createShirtCanvas();
        }
        shirtCanvases[style].size = styleData.size;
        shirtCanvases[style].shirtColor = styleData.shirtColor;
        shirtCanvases[style].backgroundColor = styleData.backgroundColor;
        shirtCanvases[style].customBackgroundColor = styleData.customBackgroundColor;
        shirtCanvases[style].isEmpty = false;

        const shirtImg = new Image();
        shirtImg.onload = () => {
          const shirtCtx = shirtCanvases[style].shirtCtx;
          shirtCtx.clearRect(0, 0, shirtCanvases[style].shirtCanvas.width, shirtCanvases[style].shirtCanvas.height);
          shirtCtx.drawImage(shirtImg, 0, 0);
          shirtCanvases[style].originalDesign.getContext('2d').drawImage(shirtImg, 0, 0);
          logger.debug(`[${new Date().toISOString()}] Obnoven shirtCanvas pro ${style}`);

          // Update UI for the current style
          if (style === currentStyle) {
            updateShirtColorOptions(currentStyle);
            updateBackgroundColorOptions();
            selectShirtColor(styleData.shirtColor);
            selectBackgroundColor(styleData.backgroundColor, styleData.customBackgroundColor);
            applySizeScaling(styleData.size, drawCanvas);
          }
        };
        shirtImg.src = styleData.shirtCanvas;
      });

      // Save restored state
      saveCanvasState(drawCanvas, getCurrentShirtCanvas(), 'Načíst projekt', null);
      callback();
    };
    img.src = projectData.drawCanvas;
  }
}