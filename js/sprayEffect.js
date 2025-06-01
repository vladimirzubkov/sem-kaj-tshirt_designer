// sprayEffect.js
export function applySprayEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) {
  const startTime = performance.now();
  const width = targetContext.canvas.width;  // 213
  const height = targetContext.canvas.height; // 284
  const sourceWidth = sourceCanvas.width;  // 375
  const sourceHeight = sourceCanvas.height; // 500
  const scaleX = width / sourceWidth;
  const scaleY = height / sourceHeight;

  const sourceCtx = sourceCanvas.getContext('2d');
  const sourceData = sourceCtx.getImageData(0, 0, sourceWidth, sourceHeight).data;

  // Check if sourceCanvas has content
  let sourceNonZeroPixels = 0;
  for (let i = 3; i < sourceData.length; i += 4) {
    if (sourceData[i] !== 0) sourceNonZeroPixels++;
  }
  console.log(`[${new Date().toISOString()}] Spray: Non-zero pixels on sourceCanvas: ${sourceNonZeroPixels}`);

  console.log(`[${new Date().toISOString()}] Spray effect started`);

  const dropletsPerFrame = 25; // 25 droplets every 0.1 seconds
  const totalFrames = 200; // 20 seconds / 0.1 seconds = 200 frames
  const totalTargetDroplets = dropletsPerFrame * totalFrames; // 5000 droplets total

  let totalDroplets = 0;

  // Function to apply a single frame of droplets
  const applyFrame = () => {
    const dropletsThisFrame = Math.min(dropletsPerFrame, totalTargetDroplets - totalDroplets);
    totalDroplets += dropletsThisFrame;

    console.log(`[${new Date().toISOString()}] Spray frame: Applying ${dropletsThisFrame} droplets, total: ${totalDroplets}`);

    for (let i = 0; i < dropletsThisFrame; i++) {
      const srcX = Math.random() * sourceWidth;
      const srcY = Math.random() * sourceHeight;
      const srcXClamped = Math.max(0, Math.min(sourceWidth - 1, Math.round(srcX)));
      const srcYClamped = Math.max(0, Math.min(sourceHeight - 1, Math.round(srcY)));
      const srcIdx = (srcYClamped * sourceWidth + srcXClamped) * 4;

      // Only apply droplet if the pixel is non-transparent (alpha > 0)
      if (sourceData[srcIdx + 3] > 0) {
        const radius = Math.random() * 4 + 1; // Radius 1–5 pixels
        const x = srcX * scaleX;
        const y = srcY * scaleY;

        // Use full opacity for the droplet to ensure visibility
        targetContext.fillStyle = `rgba(${sourceData[srcIdx]}, ${sourceData[srcIdx + 1]}, ${sourceData[srcIdx + 2]}, 1)`;
        targetContext.beginPath();
        targetContext.arc(x, y, radius, 0, Math.PI * 2);
        targetContext.fill();
      }
    }

    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / maxDuration, 1);
    console.log(`[${new Date().toISOString()}] Spray progress: ${progress * 100}%`);
    callback(progress);

    // Log the canvas content after applying droplets
    const canvasData = targetContext.getImageData(0, 0, width, height).data;
    let nonZeroPixels = 0;
    for (let i = 3; i < canvasData.length; i += 4) {
      if (canvasData[i] !== 0) nonZeroPixels++;
    }
    console.log(`[${new Date().toISOString()}] Spray: Non-zero pixels on shirtCanvas: ${nonZeroPixels}`);
  };

  // Apply frames while the button is pressed
  const drawSpray = () => {
    if (isEffectActive()) {
      applyFrame();
      setTimeout(drawSpray, 100); // Next frame after 0.1 seconds
    } else {
      console.log(`[${new Date().toISOString()}] Spray effect stopped by user`);
    }
  };

  // Start the spray effect
  drawSpray();
}