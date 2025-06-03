// effectManager.js
import { applyStampEffect } from './stampEffect.js';
import { applySprayEffect } from './sprayEffect.js';
import { applyRollEffect } from './rollEffect.js';
import { applyMixerEffect } from './mixerEffect.js';
import { applyShredderEffect } from './shredderEffect.js';
import { logger } from './logger.js';

// Audio placeholders for effects (to be configured later)
const effectSounds = {
  stamp: null, // new Audio('sounds/stamp.mp3'),
  spray: null, // new Audio('sounds/spray.mp3'),
  roll: null, // new Audio('sounds/roll.mp3'),
  mixer: null, // new Audio('sounds/mixer.mp3'),
  shred: null, // new Audio('sounds/shred.mp3'),
};

// Function to play sound for an effect (if sound exists and enabled)
function playEffectSound(effectName) {
  const sound = effectSounds[effectName];
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(error => logger.error(`[${new Date().toISOString()}] Failed to play sound for ${effectName}:`, error));
  }
}

// Utility to create optimized canvas context
export function createOptimizedContext(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    logger.error(`[${new Date().toISOString()}] Failed to create canvas context`);
    throw new Error('Cannot create canvas context');
  }
  logger.debug(`[${new Date().toISOString()}] createOptimizedContext: created context for canvas with willReadFrequently=true`);
  return ctx;
}

// Utility to count non-zero pixels in canvas
export function countNonZeroPixels(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height).data;
  let nonZeroPixels = 0;
  for (let i = 3; i < imageData.length; i += 4) {
    if (imageData[i] !== 0) nonZeroPixels++;
  }
  return nonZeroPixels;
}

// Utility to check if canvas is empty
export function isCanvasEmpty(ctx, width, height) {
  return countNonZeroPixels(ctx, width, height) === 0;
}

export const effectHandlers = {
  stamp: async (sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) => {
    playEffectSound('stamp');
    await applyStampEffect(targetContext, sourceCanvas, targetContext.canvas, callback);
  },

  spray: (sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) => {
    playEffectSound('spray');
    applySprayEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive);
  },

  roll: (sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) => {
    playEffectSound('roll');
    applyRollEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive);
  },

  mixer: (sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) => {
    playEffectSound('mixer');
    applyMixerEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive);
  },

  shred: (sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) => {
    playEffectSound('shred');
    applyShredderEffect(sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive);
  }
};