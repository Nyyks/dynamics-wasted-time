# Dynamics Wasted Time Tracker

A browser extension that tracks the time wasted waiting for loading indicators on Dynamics 365 websites.

## Download

- **Firefox**: https://addons.mozilla.org/en-US/firefox/addon/dynamics-time-tracker/
- **Chrome / Edge**: https://chromewebstore.google.com/detail/pmfocfbjjdbgpckhbfbciaddapgeeoen

## Features

### Time Tracking
- Automatically starts and stops the timer when the Dynamics 365 loading indicator (`ShellProcessingDiv` / `ShellBlockingDiv`) is visible
- **Wasted Time Today** — resets at midnight
- **Wasted Time Total** — cumulative since installation
- Live badge on the extension icon showing the current session time

### Statistics Dashboard
- Bar chart in the popup showing daily wasted time
- Hover over a bar to see the exact time for that day
- Timespan selector: Last 7 days, 14 days, 30 days, Last year, All time
- Today's bar is highlighted in orange

### Leaderboard
- Global leaderboard showing all users ranked by total wasted time
- Your entry is highlighted with a "you" badge
- If you're outside the top 10, your rank is shown below a separator
- Stats are uploaded automatically when the loading timer stops and every 5 minutes
- The server is pinged on startup — if unreachable, uploads and the leaderboard are disabled for that session
- Self-hostable (see [Server](#server) below)

### Settings
- **Sound notifications** — play a custom MP3 when the loading indicator appears
- **Leaderboard** — enable/disable the feature, set your display name, configure a custom server URL
- **Data management** — export and import all data (including daily stats) as JSON, reset all data

## Usage

1. Navigate to any `*.dynamics.com` page
2. The timer starts automatically when the loading indicator appears and stops when it disappears
3. Click the extension icon to see your stats, the daily chart, and the leaderboard
4. Open **⚙️ Settings** to configure sound notifications, your leaderboard name, or data management

## Server

The leaderboard requires a backend server. A self-hostable server is included in the `server/` folder.

### Running with Docker Compose

```bash
cd server
docker compose up -d
```

The server runs on port `3000` by default. SQLite data is persisted in `./server/data/`.

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/stats` | Submit a user's stats |
| `GET` | `/api/leaderboard?period=today\|week\|all` | Get top 100 users ranked by time for the period (default `today`) |
| `GET` | `/health` | Health check |

The default public server is `https://d365.satan.lgbt`. You can point the extension to your own instance in **Settings → Leaderboard → Server URL**.

## Monitored Elements

The extension watches for visibility changes on two elements:

- `#ShellProcessingDiv` — the spinning processing indicator
- `#ShellBlockingDiv` — the full-page blocking overlay

## Changelog

### v1.5
- Added global leaderboard with self-hostable server (Docker Compose)
- Added one-time prompt to set a display name for the leaderboard
- Server reachability check on startup — leaderboard disabled for session if server is down
- Fixed popup width staying stable on HiDPI screens

### v1.4
- Added daily statistics bar chart with hover tooltips
- Added timespan selector (7 / 14 / 30 days / last year / all time)
- Added "Buy me a Coffee" link
- Improved timer reliability — content script now sends explicit start/stop messages instead of relying solely on background polling

### v1.3
- Fixed Y-axis scale showing wrong units for small values (now shows seconds/minutes/hours correctly)

### v1.2
- Initial statistics dashboard
- Daily data tracked in storage and included in export/import
