// Update the UI with current time values
async function updateUI() {
  const data = await browser.storage.local.get(['todaySeconds', 'totalSeconds', 'lastReset']);
  
  const todaySeconds = data.todaySeconds || 0;
  const totalSeconds = data.totalSeconds || 0;
  
  document.getElementById('todayTime').textContent = formatTime(todaySeconds);
  document.getElementById('totalTime').textContent = formatTime(totalSeconds);
  
  // Check if on dynamics.com and loading indicator is visible
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  
  if (currentTab.url && currentTab.url.includes('dynamics.com')) {
    document.getElementById('statusText').textContent = 'On Dynamics.com';
    // Query the content script for loading indicator status
    try {
      const response = await browser.tabs.sendMessage(currentTab.id, { action: 'getLoadingStatus' });
      if (response && response.isVisible) {
        document.getElementById('loadingIndicator').style.display = 'block';
      } else {
        document.getElementById('loadingIndicator').style.display = 'none';
      }
    } catch (e) {
      // Content script not ready yet
    }
  } else {
    document.getElementById('statusText').textContent = 'Not on Dynamics.com';
    document.getElementById('loadingIndicator').style.display = 'none';
  }
}

// Format seconds to HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Reset today's time
document.getElementById('resetTodayBtn').addEventListener('click', async () => {
  if (confirm('Reset today\'s wasted time?')) {
    await browser.storage.local.set({ todaySeconds: 0 });
    updateUI();
  }
});

// Open settings
document.getElementById('settingsBtn').addEventListener('click', () => {
  browser.runtime.openOptionsPage();
});

// Update UI on popup open
updateUI();

// Refresh UI every second
setInterval(updateUI, 1000);
