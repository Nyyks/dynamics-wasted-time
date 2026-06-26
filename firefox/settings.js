// Settings page script

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
  const data = await browser.storage.local.get(['soundEnabled', 'soundUrl', 'soundFileName', 'leaderboardEnabled', 'leaderboardUsername', 'leaderboardServer']);
  
  soundEnabledCheckbox.checked = data.soundEnabled || false;
  updateSoundSettings();

  if (data.soundFileName) {
    currentSoundDiv.textContent = `Aktuelle Datei: ${data.soundFileName}`;
  }

  if (data.soundUrl) {
    soundPreview.src = data.soundUrl;
    soundPreview.style.display = 'block';
  }

  leaderboardEnabledCheckbox.checked = data.leaderboardEnabled !== false;
  leaderboardUsernameInput.value = data.leaderboardUsername || '';
  leaderboardServerInput.value = data.leaderboardServer || '';
}

// Toggle sound settings visibility
soundEnabledCheckbox.addEventListener('change', async () => {
  await browser.storage.local.set({ soundEnabled: soundEnabledCheckbox.checked });
  updateSoundSettings();
  showMessage('Einstellungen gespeichert', 'success');
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
    showMessage('Bitte wählen Sie eine Audio-Datei aus', 'error');
    return;
  }
  
  // Convert file to Data URL
  const reader = new FileReader();
  reader.onload = async (event) => {
    const dataUrl = event.target.result;
    
    await browser.storage.local.set({
      soundUrl: dataUrl,
      soundFileName: file.name
    });
    
    currentSoundDiv.textContent = `Aktuelle Datei: ${file.name}`;
    soundPreview.src = dataUrl;
    soundPreview.style.display = 'block';
    showMessage('Sound-Datei gespeichert', 'success');
  };
  
  reader.readAsDataURL(file);
});

// Export data
exportBtn.addEventListener('click', async () => {
  const data = await browser.storage.local.get(['todaySeconds', 'totalSeconds', 'lastReset', 'dailyData']);

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
  showMessage('Daten exportiert', 'success');
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
        throw new Error('Invalid data format');
      }
      
      await browser.storage.local.set({
        todaySeconds: importedData.todaySeconds,
        totalSeconds: importedData.totalSeconds,
        lastReset: importedData.lastReset || new Date().toDateString(),
        dailyData: importedData.dailyData || {}
      });
      
      showMessage('Daten erfolgreich importiert', 'success');
      loadSettings();
    } catch (err) {
      showMessage('Fehler beim Importieren: ' + err.message, 'error');
    }
  };
  
  reader.readAsText(file);
  importFileInput.value = ''; // Reset input
});

// Reset all data
resetAllBtn.addEventListener('click', async () => {
  if (confirm('Möchten Sie wirklich ALLE Daten löschen? Dies kann nicht rückgängig gemacht werden.')) {
    await browser.storage.local.set({
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
    
    showMessage('Alle Daten wurden gelöscht', 'success');
  }
});

// Leaderboard settings
leaderboardEnabledCheckbox.addEventListener('change', async () => {
  await browser.storage.local.set({ leaderboardEnabled: leaderboardEnabledCheckbox.checked });
  showMessage('Saved', 'success');
});

saveLeaderboardBtn.addEventListener('click', async () => {
  await browser.storage.local.set({
    leaderboardUsername: leaderboardUsernameInput.value.trim(),
    leaderboardServer: leaderboardServerInput.value.trim() || 'https://d365.satan.lgbt'
  });
  showMessage('Leaderboard settings saved', 'success');
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
