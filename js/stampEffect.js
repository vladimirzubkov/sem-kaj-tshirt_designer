// stampEffect.js
export function applyStampEffect(ctx, canvas, shirtCanvas) {
  // Copy full content to shirt canvas without clearing
  const shirtCtx = shirtCanvas.getContext('2d');
  
  // Check if drawCanvas has content
  const drawData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let drawNonZeroPixels = 0;
  for (let i = 3; i < drawData.length; i += 4) {
    if (drawData[i] !== 0) drawNonZeroPixels++;
  }
  console.log(`[${new Date().toISOString()}] Stamp: Non-zero pixels on drawCanvas: ${drawNonZeroPixels}`);

  // Draw the image on top of the existing content
  shirtCtx.drawImage(canvas, 0, 0, shirtCanvas.width, shirtCanvas.height);
  console.log(`[${new Date().toISOString()}] Stamp effect applied: Added image to shirtCanvas`);

  // Check if shirtCanvas has content after adding
  const shirtData = shirtCtx.getImageData(0, 0, shirtCanvas.width, shirtCanvas.height).data;
  let shirtNonZeroPixels = 0;
  for (let i = 3; i < shirtData.length; i += 4) {
    if (shirtData[i] !== 0) shirtNonZeroPixels++;
  }
  console.log(`[${new Date().toISOString()}] Stamp: Non-zero pixels on shirtCanvas after adding: ${shirtNonZeroPixels}`);
}