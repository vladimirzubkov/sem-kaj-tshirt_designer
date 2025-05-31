// js/cursorManager.js

// Function to generate a custom cursor SVG for drawing tools (circle)
export function generateDrawingCursor(size, color = '#000000') {
  const maxCursorSize = 128;
  const scale = size > maxCursorSize ? maxCursorSize / size : 1;
  const cursorSize = Math.min(size, maxCursorSize);
  const radius = (size / 2) * scale;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}">
      <circle cx="${cursorSize / 2}" cy="${cursorSize / 2}" r="${radius - 1}" fill="none" stroke="${color}" stroke-width="1"/>
    </svg>
  `;
  return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${cursorSize / 2} ${cursorSize / 2}, auto`;
}

// Function to generate a custom cursor SVG for TextTool (vertical line with serifs)
export function generateTextCursor(size, color = '#000000') {
  const maxCursorSize = 128;
  const scale = size > maxCursorSize ? maxCursorSize / size : 1;
  const cursorHeight = Math.min(size * 0.75, maxCursorSize);
  const width = 10 * scale;
  const height = cursorHeight;
  const serifLength = Math.min(size * 0.15, maxCursorSize * 0.15);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <line x1="${width / 2}" y1="0" x2="${width / 2}" y2="${height}" stroke="${color}" stroke-width="2"/>
      <line x1="${width / 2 - serifLength}" y1="0" x2="${width / 2 + serifLength}" y2="0" stroke="${color}" stroke-width="2"/>
      <line x1="${width / 2 - serifLength}" y1="${height}" x2="${width / 2 + serifLength}" y2="${height}" stroke="${color}" stroke-width="2"/>
    </svg>
  `;
  return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${width / 2} ${height}, auto`;
}