// Background service worker for the extension

let timerInterval = null;
let isLoadingIndicatorVisible = false;
let lastDateCheck = new Date().toDateString();

// Initialize storage on first install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['todaySeconds', 'totalSeconds', 'lastReset']);
  
  if (!data.todaySeconds) {
    await chrome.storage.local.set({
      todaySeconds: 0,
      totalSeconds: 0,
      lastReset: new Date().toDateString(),
      soundEnabled: false,
      soundUrl: null
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'loadingIndicatorVisible') {
    handleLoadingIndicatorVisible();
  }
});

// Handle when loading indicator becomes visible
async function handleLoadingIndicatorVisible() {
  if (isLoadingIndicatorVisible) return; // Already counting
  
  isLoadingIndicatorVisible = true;
  
  // Start the timer
  if (!timerInterval) {
    timerInterval = setInterval(async () => {
      const data = await chrome.storage.local.get(['todaySeconds', 'totalSeconds', 'lastReset']);
      let todaySeconds = data.todaySeconds || 0;
      let totalSeconds = data.totalSeconds || 0;
      
      // Check if day has changed
      const currentDate = new Date().toDateString();
      if (currentDate !== (data.lastReset || lastDateCheck)) {
        lastDateCheck = currentDate;
        todaySeconds = 0; // Reset today's time
      }
      
      // Increment both counters
      todaySeconds++;
      totalSeconds++;
      
      // Save to storage
      await chrome.storage.local.set({
        todaySeconds: todaySeconds,
        totalSeconds: totalSeconds,
        lastReset: currentDate
      });
      
      // Update extension icon badge
      chrome.action.setBadgeText({ text: formatTimeShort(todaySeconds) });
      chrome.action.setBadgeBackgroundColor({ color: '#ff6b6b' });
    }, 1000);
  }
}

// Stop the timer when loading indicator is no longer visible
async function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isLoadingIndicatorVisible = false;
  chrome.action.setBadgeText({ text: '' });
}

// Check loading status periodically
setInterval(async () => {
  const tabs = await chrome.tabs.query({ url: '*://*.dynamics.com/*' });
  
  let anyLoadingIndicatorVisible = false;
  
  for (const tab of tabs) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getLoadingStatus' });
      if (response && response.isVisible) {
        anyLoadingIndicatorVisible = true;
        handleLoadingIndicatorVisible();
      }
    } catch (e) {
      // Tab might not have content script loaded
    }
  }
  
  if (!anyLoadingIndicatorVisible && isLoadingIndicatorVisible) {
    stopTimer();
  }
}, 1000);

// Format time for badge (MM:SS or H:MM)
function formatTimeShort(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
