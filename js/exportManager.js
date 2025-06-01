// js/exportManager.js

  import { saveCanvasState } from './canvasManager.js';
  import { saveProject, loadProject } from './projectManager.js';

  // Save design as JSON
  export function saveDesign(drawCanvas) {
    console.log(`[${new Date().toISOString()}] Saving design as JSON`);
    saveProject(drawCanvas);
  }

  // Load design from JSON
  export function loadDesign(drawCanvas) {
    console.log(`[${new Date().toISOString()}] Loading design from JSON`);
    loadProject(drawCanvas);
  }

  // Export design to PDF
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