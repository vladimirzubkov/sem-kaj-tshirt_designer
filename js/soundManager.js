// soundManager.js
import { logger } from './logger.js';

const soundStateKey = 'soundEnabled';
let soundEnabled = localStorage.getItem(soundStateKey) === null ? true : localStorage.getItem(soundStateKey) !== 'false'; // Explicitly true on first load
let currentSound = null; // Track current playing sound

// Preload audio files
const sounds = {
  spray: new Audio('assets/spray.mp3'),
  shredder: new Audio('assets/shredder.mp3'),
  mixer: new Audio('assets/mixer.mp3'),
  roll: new Audio('assets/roll.mp3'),
  void: new Audio('assets/void.mp3'),
  stapler: new Audio('assets/stapler.mp3'),
  stamp: new Audio('assets/stamp.mp3'),
  huh: new Audio('assets/huh.mp3'),
  cashier: new Audio('assets/cashier.mp3'),
  no: new Audio('assets/no.mp3'),
  yes: new Audio('assets/yes.mp3'),
  hooray: new Audio('assets/hooray.mp3'),
  booo: new Audio('assets/booo.mp3')
};

// Add error handling for audio loading
Object.keys(sounds).forEach(soundName => {
  sounds[soundName].addEventListener('error', () => {
    logger.error(`[${new Date().toISOString()}] Failed to load sound ${soundName}.mp3`);
  }, { once: true });
});

// Initialize sound toggle
export function initSoundManager() {
  const soundToggle = document.getElementById('sound-toggle-input');
  if (!soundToggle) {
    logger.warn(`[${new Date().toISOString()}] Sound toggle input not found`);
    return;
  }

  // Set initial state
  soundToggle.checked = soundEnabled;
  logger.info(`[${new Date().toISOString()}] Sound initialized: ${soundEnabled ? 'enabled' : 'disabled'}`);

  // Handle toggle change
  soundToggle.addEventListener('change', () => {
    soundEnabled = soundToggle.checked;
    localStorage.setItem(soundStateKey, soundEnabled);
    logger.info(`[${new Date().toISOString()}] Sound toggled: ${soundEnabled ? 'enabled' : 'disabled'}`);
    playSound(soundEnabled ? 'yes' : 'no');
  });
}

// Play a sound if enabled
export function playSound(soundName) {
  if (!soundEnabled && soundName !== 'yes' && soundName !== 'no') {
    logger.debug(`[${new Date().toISOString()}] Sound disabled, skipping: ${soundName}`);
    return;
  }

  const sound = sounds[soundName];
  if (!sound) {
    logger.warn(`[${new Date().toISOString()}] Sound not found: ${soundName}`);
    return;
  }

  // Stop any currently playing sound
  stopCurrentSound();

  sound.currentTime = 0; // Reset to start
  sound.play()
    .then(() => {
      logger.debug(`[${new Date().toISOString()}] Playing sound: ${soundName}`);
      currentSound = sound; // Track current sound
    })
    .catch(error => {
      logger.error(`[${new Date().toISOString()}] Failed to play sound ${soundName}:`, error);
    });
}

// Stop the current sound
export function stopCurrentSound() {
  if (currentSound && !currentSound.paused) {
    currentSound.pause();
    currentSound.currentTime = 0;
    logger.debug(`[${new Date().toISOString()}] Stopped sound: ${Object.keys(sounds).find(key => sounds[key] === currentSound)}`);
  }
  currentSound = null;
}

// Check if sound is enabled
export function isSoundEnabled() {
  return soundEnabled;
}
