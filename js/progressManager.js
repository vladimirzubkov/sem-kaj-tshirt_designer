// js/progressManager.js

// Show progress bar with given progress (0 to 1)
export function showProgress(progressBar, progress) {
  progressBar.style.width = `${progress * 100}%`;
}

// Hide progress bar
export function hideProgress(progressBar) {
  progressBar.style.width = '0%';
}