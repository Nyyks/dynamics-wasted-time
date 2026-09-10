// Settings page script

const languageSelect = document.getElementById('languageSelect');
const soundEnabledCheckbox = document.getElementById('soundEnabled');
const soundSettings = document.getElementById('soundSettings');
const soundFileInput = document.getElementById('soundFile');
const currentSoundDiv = document.getElementById('currentSound');
const soundPreview = document.getElementById('soundPreview');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFile');
const resetAllBtn = document.getElementById('resetAllBtn');
const messageDiv = document.getElementById('message');

const leaderboardEnabledCheckbox = document.getElementById('leaderboardEnabled');
const leaderboardUsernameInput = document.getElementById('leaderboardUsername');
const leaderboardServerInput = document.getElementById('leaderboardServer');
const saveLeaderboardBtn = document.getElementById('saveLeaderboardBtn');

// Load settings on page load
window.addEventListener('DOMContentLoaded', loadSettings);

async function loadSettings() {
  languageSelect.value = await initI18n();

  const data = await chrome.storage.local.get(['soundEnabled', 'soundUrl', 'soundFileName', 'leaderboardEnabled', 'leaderboardUsername', 'leaderboardServer']);

  soundEnabledCheckbox.checked = data.soundEnabled || false;
  updateSoundSettings();

  if (data.soundFileName) {
    currentSoundDiv.textContent = t('currentFile', { name: data.soundFileName });
  }

  if (data.soundUrl) {
    soundPreview.src = data.soundUrl;
    soundPreview.style.display = 'block';
  }

  leaderboardEnabledCheckbox.checked = data.leaderboardEnabled !== false;
  leaderboardUsernameInput.value = data.leaderboardUsername || '';
  leaderboardServerInput.value = data.leaderboardServer || '';
}

// Switch UI language
languageSelect.addEventListener('change', async () => {
  await chrome.storage.local.set({ language: languageSelect.value });
  setLanguage(languageSelect.value);

  // The current file label is set from JS, so re-render it in the new language
  const data = await chrome.storage.local.get(['soundFileName']);
  if (data.soundFileName) {
    currentSoundDiv.textContent = t('currentFile', { name: data.soundFileName });
  }
  showMessage(t('settingsSaved'), 'success');
});

// Toggle sound settings visibility
soundEnabledCheckbox.addEventListener('change', async () => {
  await chrome.storage.local.set({ soundEnabled: soundEnabledCheckbox.checked });
  updateSoundSettings();
  showMessage(t('settingsSaved'), 'success');
});

function updateSoundSettings() {
  if (soundEnabledCheckbox.checked) {
    soundSettings.style.display = 'block';
  } else {
    soundSettings.style.display = 'none';
  }
}

// Handle sound file selection
soundFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file is audio
  if (!file.type.startsWith('audio/')) {
    showMessage(t('chooseAudio'), 'error');
    return;
  }

  // Convert file to Data URL
  const reader = new FileReader();
  reader.onload = async (event) => {
    const dataUrl = event.target.result;

    await chrome.storage.local.set({
      soundUrl: dataUrl,
      soundFileName: file.name
    });

    currentSoundDiv.textContent = t('currentFile', { name: file.name });
    soundPreview.src = dataUrl;
    soundPreview.style.display = 'block';
    showMessage(t('soundSaved'), 'success');
  };

  reader.readAsDataURL(file);
});

// Export data
exportBtn.addEventListener('click', async () => {
  const data = await chrome.storage.local.get(['todaySeconds', 'totalSeconds', 'lastReset', 'dailyData']);

  const exportData = {
    todaySeconds: data.todaySeconds || 0,
    totalSeconds: data.totalSeconds || 0,
    lastReset: data.lastReset || new Date().toDateString(),
    dailyData: data.dailyData || {},
    exportDate: new Date().toISOString()
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `dynamics-wasted-time-${new Date().toISOString().split('T')[0]}.json`;
  link.click();

  URL.revokeObjectURL(url);
  showMessage(t('dataExported'), 'success');
});

// Import data
importBtn.addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const importedData = JSON.parse(event.target.result);

      // Validate imported data
      if (typeof importedData.totalSeconds !== 'number' || typeof importedData.todaySeconds !== 'number') {
        throw new Error(t('invalidFormat'));
      }

      await chrome.storage.local.set({
        todaySeconds: importedData.todaySeconds,
        totalSeconds: importedData.totalSeconds,
        lastReset: importedData.lastReset || new Date().toDateString(),
        dailyData: importedData.dailyData || {}
      });

      showMessage(t('dataImported'), 'success');
      loadSettings();
    } catch (err) {
      showMessage(t('importError', { error: err.message }), 'error');
    }
  };

  reader.readAsText(file);
  importFileInput.value = ''; // Reset input
});

// Reset all data
resetAllBtn.addEventListener('click', async () => {
  if (confirm(t('confirmDeleteAll'))) {
    await chrome.storage.local.set({
      todaySeconds: 0,
      totalSeconds: 0,
      lastReset: new Date().toDateString(),
      dailyData: {},
      soundEnabled: false,
      soundUrl: null,
      soundFileName: null
    });

    currentSoundDiv.textContent = '';
    soundPreview.style.display = 'none';
    soundEnabledCheckbox.checked = false;
    updateSoundSettings();

    showMessage(t('allDeleted'), 'success');
  }
});

// Leaderboard settings
leaderboardEnabledCheckbox.addEventListener('change', async () => {
  await chrome.storage.local.set({ leaderboardEnabled: leaderboardEnabledCheckbox.checked });
  showMessage(t('settingsSaved'), 'success');
});

saveLeaderboardBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({
    leaderboardUsername: leaderboardUsernameInput.value.trim(),
    leaderboardServer: leaderboardServerInput.value.trim() || 'https://d365.satan.lgbt'
  });
  showMessage(t('leaderboardSaved'), 'success');
});

// Show message helper
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.style.display = 'block';
  messageDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
  messageDiv.style.color = type === 'success' ? '#155724' : '#721c24';
  messageDiv.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;

  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 3000);
}
