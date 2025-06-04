// screenManager.js
import { logger } from './logger.js';
import { isSoundEnabled } from './soundManager.js';

// Initialize screen navigation
export function initScreenNavigation() {
  const screens = {
    'editor-screen': document.getElementById('editor-screen'),
    'settings-screen': document.getElementById('settings-screen'),
    'about-screen': document.getElementById('about-screen')
  };

  // Define screen order for directional transitions
  const screenOrder = ['editor-screen', 'settings-screen', 'about-screen'];
  let currentScreen = 'editor-screen';

  // Function to switch to a specific screen with animation
  function switchScreen(targetScreenId) {
    if (targetScreenId === currentScreen) {
      logger.debug(`[${new Date().toISOString()}] Already on screen: ${targetScreenId}`);
      return;
    }

    logger.info(`[${new Date().toISOString()}] Switching to screen: ${targetScreenId}`);

    const currentScreenElement = screens[currentScreen];
    const targetScreenElement = screens[targetScreenId];

    // Handle video for about screen
    const video = document.getElementById('about-background-video');
    logger.debug(`[${new Date().toISOString()}] Video element found: ${!!video}`);
    if (video) {
      if (targetScreenId === 'about-screen') {
        logger.debug(`[${new Date().toISOString()}] Video readyState: ${video.readyState}`);
        video.loop = false; // Play only once
        video.currentTime = 0; // Reset to start
        video.muted = !isSoundEnabled(); // Mute video if sound is disabled
        logger.debug(`[${new Date().toISOString()}] Attempting to play video with sound ${isSoundEnabled() ? 'enabled' : 'disabled'}`);
        video.play()
          .then(() => {
            logger.info(`[${new Date().toISOString()}] Playing about background video with sound ${isSoundEnabled() ? 'enabled' : 'disabled'}`);
          })
          .catch(error => {
            logger.error(`[${new Date().toISOString()}] Failed to play about video:`, error);
          });
      } else {
        if (!video.paused) {
          video.pause();
          video.currentTime = 0;
          logger.info(`[${new Date().toISOString()}] Paused about background video`);
        }
        video.muted = false; // Reset muted state for next play
      }
    } else if (targetScreenId === 'about-screen') {
      logger.warn(`[${new Date().toISOString()}] About background video element not found`);
    }

    // Determine animation direction based on screen order
    const currentIndex = screenOrder.indexOf(currentScreen);
    const targetIndex = screenOrder.indexOf(targetScreenId);
    const isForward = targetIndex > currentIndex;

    // Remove previous animation classes
    Object.values(screens).forEach(screen => {
      screen.classList.remove('slide-in-right', 'slide-out-left', 'slide-in-left', 'slide-out-right');
    });

    // Apply animation classes
    if (isForward) {
      currentScreenElement.classList.add('slide-out-left');
      targetScreenElement.classList.add('slide-in-right');
    } else {
      currentScreenElement.classList.add('slide-out-right');
      targetScreenElement.classList.add('slide-in-left');
    }

    // Update screen visibility
    Object.values(screens).forEach(screen => {
      screen.classList.toggle('active', screen.id === targetScreenId);
    });

    // Update link states
    document.querySelectorAll('.nav-link').forEach(link => {
      const screenId = link.dataset.screen;
      if (screenId === targetScreenId) {
        link.classList.add('active');
        link.removeAttribute('href');
        link.onclick = null;
      } else {
        link.classList.remove('active');
        link.setAttribute('href', '#');
        link.onclick = (e) => {
          e.preventDefault();
          switchScreen(screenId);
        };
      }
    });

    // Update current screen
    currentScreen = targetScreenId;

    // Clean up animation classes after transition
    setTimeout(() => {
      Object.values(screens).forEach(screen => {
        screen.classList.remove('slide-in-right', 'slide-out-left', 'slide-in-left', 'slide-out-right');
      });
    }, 300); // Match animation duration (0.3s)
  }

  // Bind click events to links
  document.querySelectorAll('.nav-link').forEach(link => {
    const screenId = link.dataset.screen;
    if (screenId) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        switchScreen(screenId);
      });
    }
  });

  // Initialize with editor screen
  switchScreen('editor-screen');
}
