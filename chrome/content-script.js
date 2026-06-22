// Content script that runs on dynamics.com pages

let wasVisible = false;
let audioElement = null;

function isShellProcessingDivVisible() {
  const element = document.getElementById('ShellProcessingDiv');
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' &&
         style.visibility !== 'hidden' &&
         style.opacity !== '0' &&
         element.offsetHeight > 0 &&
         element.offsetWidth > 0;
}

function isShellBlockingDivVisible() {
  const element = document.getElementById('ShellBlockingDiv');
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' &&
         style.visibility !== 'hidden' &&
         style.opacity !== '0' &&
         element.offsetHeight > 0 &&
         element.offsetWidth > 0;
}

function checkAndNotify() {
  const isVisible = isShellProcessingDivVisible() || isShellBlockingDivVisible();

  if (isVisible && !wasVisible) {
    wasVisible = true;
    chrome.runtime.sendMessage({ action: 'loadingStarted' }).catch(() => {});
    playNotificationSound();
  } else if (!isVisible && wasVisible) {
    wasVisible = false;
    chrome.runtime.sendMessage({ action: 'loadingStopped' }).catch(() => {});
  }
}

async function playNotificationSound() {
  const data = await chrome.storage.local.get(['soundUrl', 'soundEnabled']);
  if (!data.soundEnabled || !data.soundUrl) return;
  try {
    if (!audioElement) audioElement = new Audio();
    audioElement.src = data.soundUrl;
    audioElement.volume = 0.5;
    audioElement.play().catch(() => {});
  } catch (e) {}
}

function setupObserver() {
  const observer = new MutationObserver(checkAndNotify);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'display'],
  });
  checkAndNotify();
}

if (document.documentElement) {
  setupObserver();
} else {
  document.addEventListener('DOMContentLoaded', setupObserver);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getLoadingStatus') {
    sendResponse({ isVisible: isShellProcessingDivVisible() || isShellBlockingDivVisible() });
  }
});

// Fallback: check every second in case mutation observer misses something
setInterval(checkAndNotify, 1000);
