// js/projectManager.js

import { saveCanvasState } from './canvasManager.js';

// Save design as PNG
export function saveDesign(drawCanvas, shirtCanvas) {
  console.log(`[${new Date().toISOString()}] Saving design`);
  const dataURL = drawCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'tshirt-design.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  saveCanvasState(drawCanvas, shirtCanvas, 'Save Design', null);
}

// Load design from file
export function loadDesign(drawCanvas, shirtCanvas) {
  console.log(`[${new Date().toISOString()}] Loading design`);
  const loadInput = document.getElementById('loadDesignInput');
  loadInput.click();

  // Move event listener to a separate function to ensure it's only added once
  loadInput.addEventListener('change', handleFileLoad, { once: true });

  function handleFileLoad(e) {
    const file = e.target.files[0];
    if (!file) {
      console.log(`[${new Date().toISOString()}] No file selected for loading`);
      return;
    }

    const validTypes = ['image/png'];
    if (!validTypes.includes(file.type)) {
      console.log(`[${new Date().toISOString()}] Invalid file type for loading: ${file.type}`);
      alert('Please load a PNG file saved from this editor.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        console.log(`[${new Date().toISOString()}] Loading image onto canvas`);
        const ctx = drawCanvas.getContext('2d');
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        ctx.drawImage(img, 0, 0, drawCanvas.width, drawCanvas.height);
        saveCanvasState(drawCanvas, shirtCanvas, 'Load Design', null);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Export design to PDF (from shirtCanvas)
export function exportToPDF(drawCanvas, shirtCanvas) {
  console.log(`[${new Date().toISOString()}] Exporting to PDF`);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [shirtCanvas.width, shirtCanvas.height + 50]
  });

  doc.setFontSize(16);
  doc.text('T-Shirt Design', 20, 30);

  const designData = shirtCanvas.toDataURL('image/png');
  doc.addImage(designData, 'PNG', 0, 50, shirtCanvas.width, shirtCanvas.height);

  doc.save('tshirt-design.pdf');
  saveCanvasState(drawCanvas, shirtCanvas, 'Export to PDF', null);
}

// Send PDF via email (stub)
export function sendEmail(drawCanvas, shirtCanvas) {
  console.log(`[${new Date().toISOString()}] Sending email (stub)`);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [shirtCanvas.width, shirtCanvas.height + 50]
  });

  doc.setFontSize(16);
  doc.text('T-Shirt Design', 20, 30);

  const designData = shirtCanvas.toDataURL('image/png');
  doc.addImage(designData, 'PNG', 0, 50, shirtCanvas.width, shirtCanvas.height);

  const dataURL = doc.output('datauristring');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'tshirt-design-for-email.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert('PDF has been "sent" via email. In a real application, this would send the PDF to an email server. For now, it has been downloaded.');
  saveCanvasState(drawCanvas, shirtCanvas, 'Send Email', null);
}