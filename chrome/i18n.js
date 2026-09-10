// UI translations for the popup and settings pages. The chosen language is stored as "language" in storage.local.

const TRANSLATIONS = {
  en: {
    // Popup
    bannerBefore: '⚠️ No display name set — go to ',
    bannerLink: 'Settings',
    bannerAfter: ' to join the leaderboard.',
    wastedToday: 'Wasted Time Today',
    wastedTotal: 'Wasted Time Total',
    statusLabel: 'Status:',
    onDynamics: 'On Dynamics.com',
    notOnDynamics: 'Not on Dynamics.com',
    loadingVisible: '⚠️ Loading indicator visible',
    dailyStats: 'Daily Stats',
    last7Days: 'Last 7 days',
    last14Days: 'Last 14 days',
    last30Days: 'Last 30 days',
    lastYear: 'Last year',
    allTime: 'All time',
    leaderboard: 'Leaderboard',
    lbToday: 'Today',
    lbWeek: 'Last Week',
    lbAll: 'All Time',
    refresh: 'Refresh',
    loading: 'Loading...',
    lbUnreachable: 'Leaderboard server is unreachable.',
    lbEmpty: 'No entries yet — be the first!',
    lbYou: 'you',
    lbFetchError: 'Could not reach leaderboard server.',
    resetToday: 'Reset Today',
    confirmResetToday: "Reset today's wasted time?",
    settingsButton: '⚙️ Settings',
    coffee: 'Buy me a Coffee ☕',

    // Settings
    settingsPageTitle: 'Dynamics Wasted Time Tracker - Settings',
    settingsHeading: '⚙️ Settings',
    language: 'Language',
    displayLanguage: 'Display language',
    notifications: 'Notifications',
    soundEnabled: 'Play a sound when the loading indicator is visible',
    chooseMp3: 'Choose an MP3 file:',
    currentFile: 'Current file: {name}',
    dataManagement: 'Data management',
    exportData: '📥 Export data',
    importData: '📤 Import data',
    deleteAll: '🗑️ Delete all data',
    enableLeaderboard: 'Enable leaderboard',
    leaderboardHint: 'Shows the leaderboard in the popup and uploads your stats to the server.',
    displayName: 'Display name',
    displayNamePlaceholder: 'Your name on the leaderboard',
    serverUrl: 'Server URL',
    saveLeaderboard: 'Save leaderboard settings',
    settingsSaved: 'Settings saved',
    chooseAudio: 'Please choose an audio file',
    soundSaved: 'Sound file saved',
    dataExported: 'Data exported',
    dataImported: 'Data imported successfully',
    importError: 'Import failed: {error}',
    invalidFormat: 'Invalid data format',
    confirmDeleteAll: 'Do you really want to delete ALL data? This cannot be undone.',
    allDeleted: 'All data has been deleted',
    leaderboardSaved: 'Leaderboard settings saved'
  },
  de: {
    // Popup
    bannerBefore: '⚠️ Kein Anzeigename festgelegt — legen Sie in den ',
    bannerLink: 'Einstellungen',
    bannerAfter: ' einen fest, um an der Rangliste teilzunehmen.',
    wastedToday: 'Verschwendete Zeit heute',
    wastedTotal: 'Verschwendete Zeit gesamt',
    statusLabel: 'Status:',
    onDynamics: 'Auf Dynamics.com',
    notOnDynamics: 'Nicht auf Dynamics.com',
    loadingVisible: '⚠️ Ladeanzeige sichtbar',
    dailyStats: 'Tagesstatistik',
    last7Days: 'Letzte 7 Tage',
    last14Days: 'Letzte 14 Tage',
    last30Days: 'Letzte 30 Tage',
    lastYear: 'Letztes Jahr',
    allTime: 'Gesamter Zeitraum',
    leaderboard: 'Rangliste',
    lbToday: 'Heute',
    lbWeek: 'Letzte Woche',
    lbAll: 'Gesamt',
    refresh: 'Aktualisieren',
    loading: 'Wird geladen...',
    lbUnreachable: 'Der Ranglisten-Server ist nicht erreichbar.',
    lbEmpty: 'Noch keine Einträge — machen Sie den Anfang!',
    lbYou: 'Sie',
    lbFetchError: 'Der Ranglisten-Server konnte nicht erreicht werden.',
    resetToday: 'Heute zurücksetzen',
    confirmResetToday: 'Die heute verschwendete Zeit zurücksetzen?',
    settingsButton: '⚙️ Einstellungen',
    coffee: 'Spendieren Sie mir einen Kaffee ☕',

    // Settings
    settingsPageTitle: 'Dynamics Wasted Time Tracker - Einstellungen',
    settingsHeading: '⚙️ Einstellungen',
    language: 'Sprache',
    displayLanguage: 'Anzeigesprache',
    notifications: 'Benachrichtigungen',
    soundEnabled: 'Ton abspielen, wenn die Ladeanzeige sichtbar ist',
    chooseMp3: 'MP3-Datei auswählen:',
    currentFile: 'Aktuelle Datei: {name}',
    dataManagement: 'Datenverwaltung',
    exportData: '📥 Daten exportieren',
    importData: '📤 Daten importieren',
    deleteAll: '🗑️ Alle Daten löschen',
    enableLeaderboard: 'Rangliste aktivieren',
    leaderboardHint: 'Zeigt die Rangliste im Popup an und lädt Ihre Statistiken auf den Server hoch.',
    displayName: 'Anzeigename',
    displayNamePlaceholder: 'Ihr Name in der Rangliste',
    serverUrl: 'Server-URL',
    saveLeaderboard: 'Ranglisten-Einstellungen speichern',
    settingsSaved: 'Einstellungen gespeichert',
    chooseAudio: 'Bitte wählen Sie eine Audio-Datei aus',
    soundSaved: 'Sound-Datei gespeichert',
    dataExported: 'Daten exportiert',
    dataImported: 'Daten erfolgreich importiert',
    importError: 'Fehler beim Importieren: {error}',
    invalidFormat: 'Ungültiges Datenformat',
    confirmDeleteAll: 'Möchten Sie wirklich ALLE Daten löschen? Dies kann nicht rückgängig gemacht werden.',
    allDeleted: 'Alle Daten wurden gelöscht',
    leaderboardSaved: 'Ranglisten-Einstellungen gespeichert'
  }
};

let currentLang = 'en';

function defaultLanguage() {
  return (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
}

// Loads the saved language (falling back to the browser language) and translates the page
async function initI18n() {
  const data = await chrome.storage.local.get(['language']);
  currentLang = TRANSLATIONS[data.language] ? data.language : defaultLanguage();
  applyTranslations();
  return currentLang;
}

function setLanguage(lang) {
  currentLang = TRANSLATIONS[lang] ? lang : 'en';
  applyTranslations();
}

// Locale for toLocaleDateString
function dateLocale() {
  return currentLang === 'de' ? 'de-CH' : 'en';
}

// Looks up a string and fills {placeholders} from params
function t(key, params = {}) {
  const str = TRANSLATIONS[currentLang][key] ?? TRANSLATIONS.en[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

// Translates elements marked with data-i18n (text), data-i18n-placeholder and data-i18n-title
function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
}
