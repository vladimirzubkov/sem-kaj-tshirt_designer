/**
 * orderForm.js
 * Manages the order form modal for T-shirt ordering
 */

import { logger } from './logger.js';
import { getAllShirtCanvases } from './shirtCanvasManager.js';
import { isCanvasEmpty } from './effectManager.js';
import { exportToPDF } from './projectManager.js';
import { playSound } from './soundManager.js';

// Initialize modal container
export function initOrderForm() {
  const modal = document.createElement('div');
  modal.id = 'orderModal';
  modal.className = 'modal';
  modal.style.display = 'none';
  document.body.appendChild(modal);
  logger.info(`[${new Date().toISOString()}] Order form modal initialized`);
}

// Open the order modal and generate form content
export function openOrderModal() {
  const modal = document.getElementById('orderModal');
  if (!modal) {
    logger.error(`[${new Date().toISOString()}] Order modal not found`);
    return;
  }

  // Get available styles with non-empty canvases
  const shirtCanvases = getAllShirtCanvases();
  const availableStyles = ['man', 'woman', 'kid'].filter(style => {
    const canvas = shirtCanvases[style]?.shirtCanvas;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    const isEmpty = isCanvasEmpty(ctx, canvas.width, canvas.height);
    logger.debug(`[${new Date().toISOString()}] Checking canvas for ${style}: empty=${isEmpty}`);
    return !isEmpty;
  });

  if (availableStyles.length === 0) {
    logger.warn(`[${new Date().toISOString()}] No styles with non-empty canvases available for order form`);
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Order T-Shirts</h2>
        <p>No designs available. Please create a design first.</p>
        <div class="form-actions">
          <button type="button" class="button cancel-button">Close</button>
        </div>
      </div>
    `;
    modal.querySelector('.cancel-button').addEventListener('click', () => {
      playSound('huh'); // Play huh for Close
      closeModal();
    });
  } else {
    // Generate table rows for available styles
    const tableRows = availableStyles.map(style => `
      <tr>
        <td>${style.charAt(0).toUpperCase() + style.slice(1)}</td>
        <td><input type="number" name="${style}-xxl" min="0" value="0"></td>
        <td><input type="number" name="${style}-xl" min="0" value="0"></td>
        <td><input type="number" name="${style}-l" min="0" value="0"></td>
        <td><input type="number" name="${style}-m" min="0" value="0"></td>
        <td><input type="number" name="${style}-s" min="0" value="0"></td>
      </tr>
    `).join('');

    // Create modal content
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Order T-Shirts</h2>
        <form id="orderForm">
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <h3>Quantity by Style and Size</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>Style</th>
                  <th>XXL</th>
                  <th>XL</th>
                  <th>L</th>
                  <th>M</th>
                  <th>S</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
          <div class="form-actions">
            <button type="submit" class="button">Submit</button>
            <button type="button" class="button cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    `;

    // Handle form submission
    const form = modal.querySelector('#orderForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      logger.debug(`[${new Date().toISOString()}] Form submit triggered`);
      const formData = new FormData(form);
      const orderData = {
        email: formData.get('email'),
        quantities: {},
        designs: {}
      };

      // Collect quantities for available styles
      availableStyles.forEach(style => {
        orderData.quantities[style] = {};
        ['xxl', 'xl', 'l', 'm', 's'].forEach(size => {
          orderData.quantities[style][size] = parseInt(formData.get(`${style}-${size}`)) || 0;
        });
      });

      // Generate PDFs for available styles
      const drawCanvas = document.getElementById('drawCanvas');
      for (const style of availableStyles) {
        const shirtCanvas = shirtCanvases[style].shirtCanvas;
        try {
          const pdfDataUrl = await new Promise((resolve, reject) => {
            exportToPDF(drawCanvas, shirtCanvas, true, dataUrl => {
              if (dataUrl) resolve(dataUrl);
              else reject(new Error(`Failed to generate PDF for ${style}`));
            });
          });
          orderData.designs[style] = pdfDataUrl;
          logger.info(`[${new Date().toISOString()}] PDF generated for ${style}`);
        } catch (error) {
          logger.error(`[${new Date().toISOString()}] Failed to generate PDF for ${style}:`, error);
        }
      }

      logger.info(`[${new Date().toISOString()}] Order submitted with data:`, JSON.stringify(orderData, null, 2));
      console.log('Order data with PDFs:', orderData);
      playSound('hooray');
      closeModal();
    });

    // Handle cancel button
    modal.querySelector('.cancel-button').addEventListener('click', () => {
      playSound('booo'); // Play booo for Cancel
      closeModal();
    });
  }

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      logger.debug(`[${new Date().toISOString()}] Order modal closed by clicking outside`);
      playSound('huh');
      closeModal();
    }
  });

  modal.style.display = 'flex';
  logger.info(`[${new Date().toISOString()}] Order modal opened`);
}

// Close the order modal
function closeModal() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.style.display = 'none';
    modal.innerHTML = ''; // Clear content to ensure fresh form on next open
    logger.debug(`[${new Date().toISOString()}] Order modal closed`);
  }
}
