/**
 * projectManager.js
 * Manages project saving, loading, PDF export, and email sending
 */

import { logger } from './logger.js';
import { saveCanvasState } from './historyManager.js';
import { getAllShirtCanvases, createShirtCanvas, getCurrentShirtCanvas, switchStyle } from './shirtCanvasManager.js';
import { updateShirtColorOptions, updateBackgroundColorOptions, selectShirtColor, selectBackgroundColor } from './colorManager.js';
import { applySizeScaling } from './sizeManager.js';
import { shirtColors } from './shirtColors.js';
import { isCanvasEmpty } from './effectManager.js';

const { jsPDF } = window.jspdf;

// Save project as JSON
export function saveProject(drawCanvas) {
  const fileName = prompt('Enter file name for the project (leave empty for default):');
  let finalFileName = fileName ? `${fileName}.json` : getDefaultFileName();

  const shirtCanvases = getAllShirtCanvases();
  const projectData = {
    drawCanvas: drawCanvas.toDataURL('image/png'),
    currentStyle: shirtCanvases.currentStyle,
    styles: {}
  };

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
      logger.debug(`[${new Date().toISOString()}] Saved style ${style} with non-empty design`);
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

  logger.info(`[${new Date().toISOString()}] Project saved as JSON: ${finalFileName}`);
  saveCanvasState(drawCanvas, getCurrentShirtCanvas(), 'Save Project', null);
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
          logger.info(`[${new Date().toISOString()}] Project loaded from JSON`);
        } catch (error) {
          logger.error(`[${new Date().toISOString()}] Failed to parse JSON project file:`, error);
          alert('Invalid project file format.');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

// Export design to PDF with separate pages for each style
export function exportToPDF(drawCanvas, shirtCanvas, returnDataUrl = false, callback) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a3'
    });

    const shirtCanvases = getAllShirtCanvases();
    const styles = ['man', 'woman', 'kid'].filter(style => {
      const canvas = shirtCanvases[style]?.shirtCanvas;
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      return !isCanvasEmpty(ctx, canvas.width, canvas.height);
    });

    if (styles.length === 0) {
      logger.warn(`[${new Date().toISOString()}] No non-empty styles to export to PDF`);
      if (callback) callback(null);
      return;
    }

    const styleScales = {
      man: 1,
      woman: 0.9,
      kid: 0.7
    };

    styles.forEach((style, index) => {
      if (index > 0) {
        doc.addPage();
      }

      const canvasData = shirtCanvases[style];
      const imgData = canvasData.shirtCanvas.toDataURL('image/png');

      // Text at the top, centered with bold style, size, and colors
      doc.setFontSize(12);
      const capitalizedStyle = style.charAt(0).toUpperCase() + style.slice(1);
      const capitalizedSize = canvasData.size.toUpperCase();
      const capitalizedShirtColor = canvasData.shirtColor.charAt(0).toUpperCase() + canvasData.shirtColor.slice(1);
      const backgroundColor = canvasData.backgroundColor === 'custom' ? canvasData.customBackgroundColor : canvasData.backgroundColor;
      const capitalizedBackgroundColor = backgroundColor.charAt(0).toUpperCase() + backgroundColor.slice(1);

      const parts = [
        { text: 'Style: ', bold: false },
        { text: capitalizedStyle, bold: true },
        { text: ', Size: ', bold: false },
        { text: capitalizedSize, bold: true },
        { text: ', Shirt Color: ', bold: false },
        { text: capitalizedShirtColor, bold: true },
        { text: ', Background Color: ', bold: false },
        { text: capitalizedBackgroundColor, bold: true }
      ];

      let currentX = (297 - doc.getTextWidth(parts.map(p => p.text).join(''))) / 2; // A3 width
      parts.forEach(part => {
        doc.setFont('helvetica', part.bold ? 'bold' : 'normal');
        doc.text(part.text, currentX, 20);
        currentX += doc.getTextWidth(part.text);
      });

      // Color previews on the next line, right-aligned at 180mm
      const shirtColorObj = shirtColors[style]?.find(c => c.name === canvasData.shirtColor) || { value: '#ffffff' };
      const shirtColorValue = shirtColorObj.value;
      const backgroundColorValue = canvasData.backgroundColor === 'custom' ? canvasData.customBackgroundColor : canvasData.backgroundColor === 'transparent' ? '#ffffff' : canvasData.backgroundColor;

      // Shirt color preview (20x10 mm)
      const colorX = 297 - 52; // 180mm from left (297 - 20 - 20 - 2 - 10)
      doc.setDrawColor('#808080'); // Gray border
      doc.setLineWidth(0.5);
      doc.setFillColor(shirtColorValue);
      doc.rect(colorX, 25, 20, 10, 'FD'); // Fill and draw border

      // Background color preview (20x10 mm)
      doc.setFillColor(backgroundColorValue);
      doc.rect(colorX + 22, 25, 20, 10, 'FD'); // 2mm gap

      // If background is transparent, draw a checkered pattern
      if (canvasData.backgroundColor === 'transparent') {
        doc.setFillColor('#cccccc');
        doc.rect(colorX + 22, 25, 10, 5, 'F');
        doc.rect(colorX + 32, 30, 10, 5, 'F');
        doc.setFillColor('#ffffff');
        doc.rect(colorX + 32, 25, 10, 5, 'F');
        doc.rect(colorX + 22, 30, 10, 5, 'F');
      }

      // Image centered with crop marks and scale
      const baseWidth = 100; // Base width in mm for man
      const scale = styleScales[style] || 1;
      const imgWidth = baseWidth * scale;
      const imgHeight = imgWidth * (canvasData.shirtCanvas.height / canvasData.shirtCanvas.width);
      const imgX = (297 - imgWidth) / 2; // A3 width
      const imgY = (420 - imgHeight) / 2; // A3 height
      doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);

      // Crop marks (5mm length, 0.5mm thick)
      doc.setDrawColor(0); // Black
      doc.setLineWidth(0.5);
      // Top-left
      doc.line(imgX - 2, imgY, imgX - 2, imgY - 5); // Vertical
      doc.line(imgX - 2, imgY, imgX - 7, imgY); // Horizontal
      // Top-right
      doc.line(imgX + imgWidth + 2, imgY, imgX + imgWidth + 2, imgY - 5);
      doc.line(imgX + imgWidth + 2, imgY, imgX + imgWidth + 7, imgY);
      // Bottom-left
      doc.line(imgX - 2, imgY + imgHeight, imgX - 2, imgY + imgHeight + 5);
      doc.line(imgX - 2, imgY + imgHeight, imgX - 7, imgY + imgHeight);
      // Bottom-right
      doc.line(imgX + imgWidth + 2, imgY + imgHeight, imgX + imgWidth + 2, imgY + imgHeight + 5);
      doc.line(imgX + imgWidth + 2, imgY + imgHeight, imgX + imgWidth + 7, imgY + imgHeight);

      // Scale text
      doc.setFontSize(10);
      doc.text(`Scale: 1:${scale.toFixed(1)}`, imgX + imgWidth / 2, imgY + imgHeight + 10, { align: 'center' });

      logger.info(`[${new Date().toISOString()}] Added PDF page for style: ${style}`);
    });

    const pdfDataUrl = doc.output('datauristring');
    logger.info(`[${new Date().toISOString()}] Designs exported to PDF with ${styles.length} pages`);
    saveCanvasState(drawCanvas, shirtCanvas, 'Export to PDF', null);
    if (callback) {
      callback(pdfDataUrl);
    }
    if (!returnDataUrl) {
      doc.save('shirt-designs.pdf');
    }
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Failed to export to PDF:`, error);
    if (callback) callback(null);
  }
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
  const currentStyle = projectData.currentStyle || 'man';

  // Restore drawCanvas
  if (projectData.drawCanvas) {
    const img = new Image();
    img.onload = () => {
      const ctx = drawCanvas.getContext('2d');
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      ctx.drawImage(img, 0, 0);
      logger.debug(`[${new Date().toISOString()}] Restored drawCanvas`);

      // Restore shirt canvases
      const promises = Object.keys(projectData.styles).map(style => {
        return new Promise((resolve, reject) => {
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
            logger.debug(`[${new Date().toISOString()}] Restored shirtCanvas for ${style}`);
            resolve();
          };
          shirtImg.onerror = () => {
            logger.error(`[${new Date().toISOString()}] Failed to load shirtCanvas image for ${style}`);
            resolve(); // Continue despite error
          };
          shirtImg.src = styleData.shirtCanvas;
        });
      });

      // Wait for all canvases to restore
      Promise.all(promises).then(() => {
        // Update DOM with the current style's canvas
        const shirtContainer = document.querySelector('.shirt-container');
        const currentCanvas = shirtContainer.querySelector('canvas.shirt-design');
        const restoredCanvas = shirtCanvases[currentStyle].shirtCanvas;

        if (currentCanvas && currentCanvas !== restoredCanvas) {
          shirtContainer.replaceChild(restoredCanvas, currentCanvas);
        } else if (!currentCanvas) {
          shirtContainer.appendChild(restoredCanvas);
        }

        // Switch to the saved style and update UI
        switchStyle(currentStyle, drawCanvas, shirtCanvases[currentStyle].shirtCanvas);
        const currentCanvasData = shirtCanvases[currentStyle];
        if (currentCanvasData) {
          updateShirtColorOptions(currentStyle);
          updateBackgroundColorOptions();
          selectShirtColor(currentCanvasData.shirtColor);
          selectBackgroundColor(currentCanvasData.backgroundColor, currentCanvasData.customBackgroundColor);
          applySizeScaling(currentCanvasData.size, drawCanvas);
        }

        // Save restored state
        saveCanvasState(drawCanvas, getCurrentShirtCanvas(), 'Load Project', null);
        if (callback) callback();
      }).catch(error => {
        logger.error(`[${new Date().toISOString()}] Error restoring shirt canvases:`, error);
        if (callback) callback();
      });
    };
    img.onerror = () => {
      logger.error(`[${new Date().toISOString()}] Failed to load drawCanvas image`);
      if (callback) callback();
    };
    img.src = projectData.drawCanvas;
  } else {
    if (callback) callback();
  }
}