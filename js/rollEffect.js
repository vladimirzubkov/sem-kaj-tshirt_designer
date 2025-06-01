// rollEffect.js
export function applyRollEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) {
  const startTime = performance.now();
  const width = targetContext.canvas.width;  // 213
  const height = targetContext.canvas.height; // 284
  const distortionLimit = height * 0.02; // 2% of canvas height (284 * 0.02 = 5.68px)
  const gridSize = 10;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  // Check if sourceCanvas has content
  const sourceCtx = sourceCanvas.getContext('2d');
  const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
  let sourceNonZeroPixels = 0;
  for (let i = 3; i < sourceData.length; i += 4) {
    if (sourceData[i] !== 0) sourceNonZeroPixels++;
  }
  console.log(`[${new Date().toISOString()}] Roll: Non-zero pixels on sourceCanvas: ${sourceNonZeroPixels}`);

  console.log(`[${new Date().toISOString()}] Roll effect started`);

  // Create a temporary canvas to store the distorted image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');

  // Function to apply a single distortion pass
  const applyDistortionPass = (alpha) => {
    // Clear the temporary canvas
    tempCtx.clearRect(0, 0, width, height);
    // Draw the original image on the temporary canvas
    tempCtx.drawImage(sourceCanvas, 0, 0, width, height);

    // Generate offsets for this pass
    const offsets = [];
    for (let y = 0; y <= gridSize; y++) {
      const row = [];
      for (let x = 0; x <= gridSize; x++) {
        const dx = (Math.random() * 2 - 1) * distortionLimit; // Random displacement up to 2% of height
        const dy = (Math.random() * 2 - 1) * distortionLimit;
        row.push({ x: x * cellWidth + dx, y: y * cellHeight + dy });
      }
      offsets.push(row);
    }

    // Apply distortion on the temporary canvas
    let imgData = tempCtx.getImageData(0, 0, width, height);
    let data = imgData.data;

    const distortedData = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
      const gy = Math.floor(y / cellHeight);
      const ly = (y % cellHeight) / cellHeight;

      for (let x = 0; x < width; x++) {
        const gx = Math.floor(x / cellWidth);
        const lx = (x % cellWidth) / cellWidth;

        const p00 = offsets[gy][gx];
        const p10 = offsets[gy][gx + 1];
        const p01 = offsets[gy + 1][gx];
        const p11 = offsets[gy + 1][gx + 1];

        const sx =
            p00.x * (1 - lx) * (1 - ly) +
            p10.x * lx * (1 - ly) +
            p01.x * (1 - lx) * ly +
            p11.x * lx * ly;
        const sy =
            p00.y * (1 - lx) * (1 - ly) +
            p10.y * lx * (1 - ly) +
            p01.y * (1 - lx) * ly +
            p11.y * lx * ly;

        const ix = Math.max(0, Math.min(width - 1, Math.round(sx)));
        const iy = Math.max(0, Math.min(height - 1, Math.round(sy)));
        const srcIdx = (iy * width + ix) * 4;
        const dstIdx = (y * width + x) * 4;

        distortedData.data[dstIdx] = data[srcIdx];
        distortedData.data[dstIdx + 1] = data[srcIdx + 1];
        distortedData.data[dstIdx + 2] = data[srcIdx + 2];
        distortedData.data[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    // Put the distorted data back on the temporary canvas
    tempCtx.putImageData(distortedData, 0, 0);

    // Draw the distorted image on the target canvas with specified transparency
    targetContext.globalAlpha = alpha;
    targetContext.drawImage(tempCanvas, 0, 0, width, height);
    targetContext.globalAlpha = 1.0;

    // Log the canvas content after applying the pass
    const canvasData = targetContext.getImageData(0, 0, width, height).data;
    let nonZeroPixels = 0;
    for (let i = 3; i < canvasData.length; i += 4) {
      if (canvasData[i] !== 0) nonZeroPixels++;
    }
    console.log(`[${new Date().toISOString()}] Roll: Non-zero pixels on shirtCanvas after pass with alpha ${alpha}: ${nonZeroPixels}`);
  };

  // Apply distortions while the button is pressed
  let firstPassDone = false;
  let secondPassDone = false;

  const applyDistortions = () => {
    if (!isEffectActive()) {
      console.log(`[${new Date().toISOString()}] Roll effect stopped by user`);
      return;
    }

    if (!firstPassDone) {
      console.log(`[${new Date().toISOString()}] Roll first pass: Applying distortion with 50% transparency`);
      applyDistortionPass(0.5);
      firstPassDone = true;
      callback(0.5); // Update progress bar to 50%
      console.log(`[${new Date().toISOString()}] Roll progress: 50%`);
    }

    if (firstPassDone && !secondPassDone) {
      setTimeout(() => {
        if (isEffectActive()) {
          console.log(`[${new Date().toISOString()}] Roll second pass: Applying distortion with 50% transparency`);
          applyDistortionPass(0.5);
          secondPassDone = true;
          callback(1); // Update progress bar to 100%
          console.log(`[${new Date().toISOString()}] Roll progress: 100%`);
        } else {
          console.log(`[${new Date().toISOString()}] Roll effect stopped before second pass`);
        }
      }, 1000); // Wait 1 second before second pass
    }
  };

  applyDistortions();
}