// effectManager.js
import { applyStampEffect } from './stampEffect.js';
import { applySprayEffect } from './sprayEffect.js';
import { applyRollEffect } from './rollEffect.js';
import { applyMixerEffect } from './mixerEffect.js';
import { applyShredderEffect } from './shredderEffect.js';

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
    sound.play().catch(error => console.error(`Failed to play sound for ${effectName}:`, error));
  }
}

export const effectHandlers = {
  stamp: (sourceCanvas, targetContext, duration, maxDuration, callback, isEffectActive) => {
    playEffectSound('stamp');
    applyStampEffect(targetContext, sourceCanvas, targetContext.canvas);
    callback(1); // Stamp completes immediately
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