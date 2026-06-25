// Background service worker for the extension

let timerInterval = null;
let isTimerRunning = false;

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['lastReset']);
  if (data.lastReset === undefined) {
    await chrome.storage.local.set({
      todaySeconds: 0,
      totalSeconds: 0,
      lastReset: new Date().toDateString(),
      dailyData: {},
      soundEnabled: false,
      soundUrl: null
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'loadingStarted') {
    startTimer();
  } else if (request.action === 'loadingStopped') {
    stopTimer();
  }
});

function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;

  if (!timerInterval) {
    timerInterval = setInterval(async () => {
      const data = await chrome.storage.local.get(['todaySeconds', 'totalSeconds', 'lastReset', 'dailyData']);
      let todaySeconds = data.todaySeconds || 0;
      let totalSeconds = data.totalSeconds || 0;
      let dailyData = data.dailyData || {};

      const currentDate = new Date().toDateString();
      if (currentDate !== data.lastReset) {
        todaySeconds = 0;
      }

      todaySeconds++;
      totalSeconds++;
      dailyData[currentDate] = (dailyData[currentDate] || 0) + 1;

      await chrome.storage.local.set({
        todaySeconds,
        totalSeconds,
        lastReset: currentDate,
        dailyData
      });

      chrome.action.setBadgeText({ text: formatTimeShort(todaySeconds) });
      chrome.action.setBadgeBackgroundColor({ color: '#ff6b6b' });
    }, 1000);
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isTimerRunning = false;
  chrome.action.setBadgeText({ text: '' });
  uploadStats();
}

async function uploadStats() {
  const data = await chrome.storage.local.get([
    'totalSeconds', 'todaySeconds', 'leaderboardEnabled', 'leaderboardUsername', 'leaderboardServer'
  ]);
  if (data.leaderboardEnabled === false) return;
  const username = (data.leaderboardUsername || '').trim();
  if (!username) return;
  const serverUrl = (data.leaderboardServer || 'https://d365.satan.lgbt').replace(/\/$/, '');
  try {
    await fetch(`${serverUrl}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        totalSeconds: data.totalSeconds || 0,
        todaySeconds: data.todaySeconds || 0
      })
    });
  } catch (e) {}
}

// Periodic upload every 5 minutes while extension is active
setInterval(uploadStats, 5 * 60 * 1000);

// Polling fallback: catches cases where content script messages are lost
setInterval(async () => {
  const tabs = await chrome.tabs.query({ url: '*://*.dynamics.com/*' });

  if (tabs.length === 0) {
    if (isTimerRunning) stopTimer();
    return;
  }

  let anyVisible = false;
  for (const tab of tabs) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getLoadingStatus' });
      if (response?.isVisible) anyVisible = true;
    } catch (e) {}
  }

  if (!anyVisible && isTimerRunning) {
    stopTimer();
  } else if (anyVisible && !isTimerRunning) {
    startTimer();
  }
}, 2000);

function formatTimeShort(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}`;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
