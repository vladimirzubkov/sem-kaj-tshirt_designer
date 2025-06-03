// projectManager.js

import { logger } from './logger.js';
import { saveCanvasState } from './historyManager.js'; // Corrected import

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