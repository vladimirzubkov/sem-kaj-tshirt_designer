// mixerEffect.js
export async function applyMixerEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) {
  const startTime = performance.now();
  const width = targetContext.canvas.width;  // 213
  const height = targetContext.canvas.height; // 284
  const centers = [];
  const maxCenters = 5;
  const maxRadius = height * 2 / 3; // 2/3 of the canvas height (284 * 2/3 ≈ 189)
  const radiusLevels = [1, 0.5, 0.333, 0.25, 0.2]; // 1, 1/2, 1/3, 1/4, 1/5
  const mergeAngles = [0, (72 * Math.PI / 180), (144 * Math.PI / 180), (216 * Math.PI / 180), (288 * Math.PI / 180)]; // 0°, 72°, 144°, 216°, 288°

  // Check if sourceCanvas has content
  const sourceCtx = sourceCanvas.getContext('2d');
  const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
  let sourceNonZeroPixels = 0;
  for (let i = 3; i < sourceData.length; i += 4) {
    if (sourceData[i] !== 0) sourceNonZeroPixels++;
  }
  console.log(`[${new Date().toISOString()}] Mixer: Non-zero pixels on sourceCanvas: ${sourceNonZeroPixels}`);

  // Check if shirtCanvas is empty; if so, copy the source image
  const shirtData = targetContext.getImageData(0, 0, width, height).data;
  let isEmpty = true;
  for (let i = 3; i < shirtData.length; i += 4) {
    if (shirtData[i] !== 0) {
      isEmpty = false;
      break;
    }
  }
  if (isEmpty) {
    console.log(`[${new Date().toISOString()}] Mixer: shirtCanvas is empty, copying source image`);
    targetContext.drawImage(sourceCanvas, 0, 0, width, height);
  }

  console.log(`[${new Date().toISOString()}] Mixer effect started`);

  // Apply up to 5 warps, one per second, while the button is pressed
  for (let i = 0; i < maxCenters; i++) {
    console.log(`[${new Date().toISOString()}] Mixer adding warp ${i + 1}`);
    // Add a new warp center
    const baseDiameter = Math.random() * (height * 0.5 - height * 0.2) + height * 0.2; // 56 to 142 pixels
    centers.push({
      x: Math.random() * width,
      y: Math.random() * height,
      baseRadius: baseDiameter / 2, // Convert diameter to radius
      type: ['merge', 'twistCW', 'twistCCW', 'inflate', 'deflate'][Math.floor(Math.random() * 5)],
      angle: 0, // For twist effects
      mergePoint: mergeAngles[Math.floor(Math.random() * mergeAngles.length)], // Random direction for merge
      applied: false // Flag to track if the warp has been applied
    });

    const center = centers[centers.length - 1];
    const currentRadius = center.baseRadius + (maxRadius - center.baseRadius); // Immediate max radius

    const imageData = targetContext.getImageData(0, 0, width, height);
    const data = imageData.data;

    const warped = new Uint8ClampedArray(data.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let dx = 0;
        let dy = 0;

        for (let j = 0; j < centers.length; j++) {
          const c = centers[j];
          const cx = c.x;
          const cy = c.y;
          const dx_ = x - cx;
          const dy_ = y - cy;
          const dist = Math.sqrt(dx_ * dx_ + dy_ * dy_);
          let level = 0;

          // Determine which concentric circle the pixel belongs to
          for (let r = 0; r < radiusLevels.length; r++) {
            if (dist <= currentRadius * radiusLevels[r]) {
              level = r + 1;
              break;
            }
          }

          if (level > 0 && !c.applied) {
            const radiusAtLevel = currentRadius * radiusLevels[level - 1];
            const ratio = dist / radiusAtLevel;
            const strength = 1 - ratio;

            if (c.type === 'merge') {
              const mergeX = cx + Math.cos(c.mergePoint) * radiusAtLevel;
              const mergeY = cy + Math.sin(c.mergePoint) * radiusAtLevel;
              const pullX = (mergeX - x) * strength;
              const pullY = (mergeY - y) * strength;
              dx += pullX;
              dy += pullY;
            } else if (c.type === 'twistCW' || c.type === 'twistCCW') {
              const direction = c.type === 'twistCW' ? 1 : -1;
              const angle = (5 * level * Math.PI / 180) * direction * strength;
              dx += Math.cos(angle) * dx_ - Math.sin(angle) * dy_ - dx_;
              dy += Math.sin(angle) * dx_ + Math.cos(angle) * dy_ - dy_;
            } else if (c.type === 'inflate') {
              const factor = 1 + strength * 0.5 * (1 - (level - 1) / radiusLevels.length);
              dx += dx_ * factor - dx_;
              dy += dy_ * factor - dy_;
            } else if (c.type === 'deflate') {
              const factor = 1 - strength * 0.5 * (1 - (level - 1) / radiusLevels.length);
              dx += dx_ * factor - dx_;
              dy += dy_ * factor - dy_;
            }
          }
        }

        const srcX = Math.min(width - 1, Math.max(0, Math.round(x + dx)));
        const srcY = Math.min(height - 1, Math.max(0, Math.round(y + dy)));
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * width + x) * 4;
        warped[dstIdx] = data[srcIdx];
        warped[dstIdx + 1] = data[srcIdx + 1];
        warped[dstIdx + 2] = data[srcIdx + 2];
        warped[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    // Mark the warp as applied
    center.applied = true;

    // Update targetContext with the new warped image
    targetContext.putImageData(new ImageData(warped, width, height), 0, 0);

    // Update progress bar
    const progress = (i + 1) / maxCenters;
    console.log(`[${new Date().toISOString()}] Mixer progress: ${progress * 100}%`);
    callback(progress);

    // Log the canvas content after applying the warp
    const canvasData = targetContext.getImageData(0, 0, width, height).data;
    let nonZeroPixels = 0;
    for (let i = 3; i < canvasData.length; i += 4) {
      if (canvasData[i] !== 0) nonZeroPixels++;
    }
    console.log(`[${new Date().toISOString()}] Mixer: Non-zero pixels on shirtCanvas after warp ${i + 1}: ${nonZeroPixels}`);

    // Wait 1 second before the next warp, unless it's the first warp
    if (i === 0) continue;

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!isEffectActive()) {
      console.log(`[${new Date().toISOString()}] Mixer effect stopped at warp ${i + 1}`);
      break;
    }
  }
}