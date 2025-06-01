// shredderEffect.js
export async function applyShredderEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) {
  const startTime = performance.now();
  const width = targetContext.canvas.width;  // 213
  const height = targetContext.canvas.height; // 284
  let pieces = [];
  const maxOffset = height / 3; // 1/3 of height (284 / 3 ≈ 94px)
  const maxSteps = 7; // 7 steps over 7 seconds

  // Check if sourceCanvas has content
  const sourceCtx = sourceCanvas.getContext('2d');
  const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
  let sourceNonZeroPixels = 0;
  for (let i = 3; i < sourceData.length; i += 4) {
    if (sourceData[i] !== 0) sourceNonZeroPixels++;
  }
  console.log(`[${new Date().toISOString()}] Shredder: Non-zero pixels on sourceCanvas: ${sourceNonZeroPixels}`);

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
    console.log(`[${new Date().toISOString()}] Shredder: shirtCanvas is empty, copying source image`);
    targetContext.drawImage(sourceCanvas, 0, 0, width, height);
  }

  console.log(`[${new Date().toISOString()}] Shredder effect started`);

  // Initial pieces: 5x5 grid
  if (pieces.length === 0) {
    const pieceWidth = width / 5;
    const pieceHeight = height / 5;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        pieces.push({
          srcX: x * pieceWidth,
          srcY: y * pieceHeight,
          width: pieceWidth,
          height: pieceHeight,
          offsetX: 0,
          offsetY: 0,
          rotation: 0, // Initial rotation
          shapeDistortion: [] // To store random shape distortions for each vertex
        });
      }
    }
  }

  // Apply 7 shredding steps, one per second, while the button is pressed
  for (let step = 0; step < maxSteps; step++) {
    console.log(`[${new Date().toISOString()}] Shredder step ${step + 1}: Subdividing pieces`);
    const currentOffset = maxOffset * (step + 1) / maxSteps; // Gradual increase in offset
    const newPieces = [];
    const subShredX = Math.ceil((step + 5) / 5); // From 5 to 7 subdivisions
    const subShredY = Math.ceil((step + 5) / 5);

    // Subdivide each piece
    pieces.forEach(piece => {
      const subWidth = piece.width / subShredX;
      const subHeight = piece.height / subShredY;

      for (let sy = 0; sy < subShredY; sy++) {
        for (let sx = 0; sx < subShredX; sx++) {
          const newOffsetX = piece.offsetX + (Math.random() - 0.5) * currentOffset;
          const newOffsetY = piece.offsetY + (Math.random() - 0.5) * currentOffset;
          const rotation = (Math.random() * 10 + 5) * (Math.random() > 0.5 ? 1 : -1); // Random rotation between -15 and 15 degrees

          // Add random shape distortion to each vertex of the piece
          const shapeDistortion = [
            { dx: (Math.random() - 0.5) * subWidth * 0.2, dy: (Math.random() - 0.5) * subHeight * 0.2 }, // Top-left
            { dx: (Math.random() - 0.5) * subWidth * 0.2, dy: (Math.random() - 0.5) * subHeight * 0.2 }, // Top-right
            { dx: (Math.random() - 0.5) * subWidth * 0.2, dy: (Math.random() - 0.5) * subHeight * 0.2 }, // Bottom-right
            { dx: (Math.random() - 0.5) * subWidth * 0.2, dy: (Math.random() - 0.5) * subHeight * 0.2 }  // Bottom-left
          ];

          newPieces.push({
            srcX: piece.srcX + sx * subWidth,
            srcY: piece.srcY + sy * subHeight,
            width: subWidth,
            height: subHeight,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
            rotation: rotation,
            shapeDistortion: shapeDistortion
          });
        }
      }
    });

    pieces = newPieces;

    // Draw the accumulated pieces with shape distortion
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(targetContext.canvas, 0, 0);

    pieces.forEach(piece => {
      targetContext.save();
      targetContext.translate(
        piece.srcX + piece.offsetX + piece.width / 2,
        piece.srcY + piece.offsetY + piece.height / 2
      );
      targetContext.rotate(piece.rotation * Math.PI / 180);

      // Apply shape distortion by drawing a distorted quad
      targetContext.beginPath();
      targetContext.moveTo(
        (-piece.width / 2) + piece.shapeDistortion[0].dx,
        (-piece.height / 2) + piece.shapeDistortion[0].dy
      );
      targetContext.lineTo(
        (piece.width / 2) + piece.shapeDistortion[1].dx,
        (-piece.height / 2) + piece.shapeDistortion[1].dy
      );
      targetContext.lineTo(
        (piece.width / 2) + piece.shapeDistortion[2].dx,
        (piece.height / 2) + piece.shapeDistortion[2].dy
      );
      targetContext.lineTo(
        (-piece.width / 2) + piece.shapeDistortion[3].dx,
        (piece.height / 2) + piece.shapeDistortion[3].dy
      );
      targetContext.closePath();
      targetContext.clip();

      targetContext.drawImage(
        tempCanvas,
        piece.srcX, piece.srcY, piece.width, piece.height,
        -piece.width / 2, -piece.height / 2, piece.width, piece.height
      );

      targetContext.restore();
    });

    // Update progress bar
    const progress = (step + 1) / maxSteps;
    console.log(`[${new Date().toISOString()}] Shredder progress: ${progress * 100}%`);
    callback(progress);

    // Log the canvas content after applying the step
    const canvasData = targetContext.getImageData(0, 0, width, height).data;
    let nonZeroPixels = 0;
    for (let i = 3; i < canvasData.length; i += 4) {
      if (canvasData[i] !== 0) nonZeroPixels++;
    }
    console.log(`[${new Date().toISOString()}] Shredder: Non-zero pixels on shirtCanvas after step ${step + 1}: ${nonZeroPixels}`);

    // Wait 1 second before the next step, unless it's the first step
    if (step === 0) continue;

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!isEffectActive()) {
      console.log(`[${new Date().toISOString()}] Shredder effect stopped at step ${step + 1}`);
      break;
    }
  }
}