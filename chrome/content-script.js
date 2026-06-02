// Content script that runs on dynamics.com pages
// It monitors for the ShellProcessingDiv and notifies the background script

let isMonitoring = false;
let observer = null;
let lastNotificationTime = 0;
let audioElement = null;

// Function to check if ShellProcessingDiv is visible
function isShellProcessingDivVisible() {
  const element = document.getElementById('ShellProcessingDiv');
  if (!element) return false;
  
  // Check if element is visible (not hidden, has dimensions, etc.)
  const style = window.getComputedStyle(element);
  const isVisible = style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0' &&
                   element.offsetHeight > 0 &&
                   element.offsetWidth > 0;
  
  return isVisible;
}

// Function to check if ShellBlockingDiv is visible
function isShellBlockingDivVisible() {
  const element = document.getElementById('ShellBlockingDiv');
  if (!element) return false;
  
  // Check if element is visible (not hidden, has dimensions, etc.)
  const style = window.getComputedStyle(element);
  const isVisible = style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0' &&
                   element.offsetHeight > 0 &&
                   element.offsetWidth > 0;
  
  return isVisible;
}

// Notify background script about loading indicator
function notifyLoadingStatus() {
  const isProcessingVisible = isShellProcessingDivVisible();
  const isBlockingVisible = isShellBlockingDivVisible();
  const isVisible = isProcessingVisible || isBlockingVisible;
  
  if (isVisible) {
    // Throttle notifications to avoid excessive messaging
    const now = Date.now();
    if (now - lastNotificationTime > 5000) {
      lastNotificationTime = now;
      chrome.runtime.sendMessage({
        action: 'loadingIndicatorVisible',
        url: window.location.href
      });
      
      // Play sound if configured
      playNotificationSound();
    }
  }
}

// Load and play notification sound
async function playNotificationSound() {
  const data = await chrome.storage.local.get(['soundUrl', 'soundEnabled']);
  
  if (!data.soundEnabled || !data.soundUrl) return;
  
  try {
    if (!audioElement) {
      audioElement = new Audio();
    }
    audioElement.src = data.soundUrl;
    audioElement.volume = 0.5;
    audioElement.play().catch(err => console.log('Could not play sound:', err));
  } catch (err) {
    console.log('Error playing sound:', err);
  }
}

// Setup mutation observer to detect when ShellProcessingDiv becomes visible
function setupObserver() {
  if (observer) return;
  
  observer = new MutationObserver(() => {
    notifyLoadingStatus();
  });
  
  // Observe the entire document for changes
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'display'],
    characterData: false
  });
  
  isMonitoring = true;
  
  // Initial check
  notifyLoadingStatus();
}

// Start monitoring when DOM is ready
if (document.documentElement) {
  setupObserver();
} else {
  document.addEventListener('DOMContentLoaded', setupObserver);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getLoadingStatus') {
    sendResponse({ isVisible: isShellProcessingDivVisible() || isShellBlockingDivVisible() });
  }
});

// Also check periodically (every 500ms) as a fallback
setInterval(() => {
  if (isMonitoring) {
    notifyLoadingStatus();
  }
}, 500);
