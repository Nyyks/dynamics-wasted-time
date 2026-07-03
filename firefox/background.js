// Background script for the extension

let timerInterval = null;
let isTimerRunning = false;
let serverReachable = true; // session-only flag, checked on startup

browser.runtime.onInstalled.addListener(async () => {
  const data = await browser.storage.local.get(['lastReset']);
  if (data.lastReset === undefined) {
    await browser.storage.local.set({
      todaySeconds: 0,
      totalSeconds: 0,
      lastReset: new Date().toDateString(),
      dailyData: {},
      soundEnabled: false,
      soundUrl: null
    });
  }
});

async function checkServerReachability() {
  const data = await browser.storage.local.get(['leaderboardEnabled', 'leaderboardServer']);
  if (data.leaderboardEnabled === false) return;
  const serverUrl = (data.leaderboardServer || 'https://d365.satan.lgbt').replace(/\/$/, '');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${serverUrl}/health`, { signal: controller.signal });
    clearTimeout(timer);
    serverReachable = res.ok;
  } catch (e) {
    serverReachable = false;
  }
}

checkServerReachability();

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'loadingStarted') {
    startTimer();
  } else if (request.action === 'loadingStopped') {
    stopTimer();
  } else if (request.action === 'getServerStatus') {
    sendResponse({ reachable: serverReachable });
  }
});

function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;

  if (!timerInterval) {
    timerInterval = setInterval(async () => {
      const data = await browser.storage.local.get(['todaySeconds', 'totalSeconds', 'lastReset', 'dailyData']);
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

      await browser.storage.local.set({
        todaySeconds,
        totalSeconds,
        lastReset: currentDate,
        dailyData
      });

      browser.action.setBadgeText({ text: formatTimeShort(todaySeconds) });
      browser.action.setBadgeBackgroundColor({ color: '#ff6b6b' });
    }, 1000);
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isTimerRunning = false;
  browser.action.setBadgeText({ text: '' });
  uploadStats();
}

function localISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Trailing 7 days (including today) of dailyData, keyed by ISO date, for the "last week" leaderboard
function buildWeekPayload(dailyData) {
  const week = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    week[localISODate(d)] = dailyData[d.toDateString()] || 0;
  }
  return week;
}

async function uploadStats() {
  if (!serverReachable) return;
  const data = await browser.storage.local.get([
    'totalSeconds', 'todaySeconds', 'dailyData', 'leaderboardEnabled', 'leaderboardUsername', 'leaderboardServer', 'lastUploadedUsername'
  ]);
  if (data.leaderboardEnabled === false) return;
  const username = (data.leaderboardUsername || '').trim();
  if (!username) return;
  const serverUrl = (data.leaderboardServer || 'https://d365.satan.lgbt').replace(/\/$/, '');

  const lastUploaded = (data.lastUploadedUsername || '').trim();
  if (lastUploaded && lastUploaded !== username) {
    try {
      await fetch(`${serverUrl}/api/user/${encodeURIComponent(lastUploaded)}`, { method: 'DELETE' });
    } catch (e) {}
  }

  try {
    const res = await fetch(`${serverUrl}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        totalSeconds: data.totalSeconds || 0,
        todaySeconds: data.todaySeconds || 0,
        dailyData: buildWeekPayload(data.dailyData || {})
      })
    });
    if (res.ok) {
      await browser.storage.local.set({ lastUploadedUsername: username });
    }
  } catch (e) {}
}

setInterval(uploadStats, 5 * 60 * 1000);

// Polling fallback: catches cases where content script messages are lost
setInterval(async () => {
  const tabs = await browser.tabs.query({ url: '*://*.dynamics.com/*' });

  if (tabs.length === 0) {
    if (isTimerRunning) stopTimer();
    return;
  }

  let anyVisible = false;
  for (const tab of tabs) {
    try {
      const response = await browser.tabs.sendMessage(tab.id, { action: 'getLoadingStatus' });
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
