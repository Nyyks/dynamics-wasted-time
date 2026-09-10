# Store listing — Dynamics Time Tracker

Copy-paste texts for the Chrome Web Store / Edge Add-ons and Firefox Add-ons (AMO).
The description is plain text (no Markdown) so it renders the same in every store.

---

## Name

Dynamics Time Tracker

## Short description / summary

**Chrome / Edge (max 132 chars):**

```
Tracks how much time you lose waiting for the Dynamics 365 loading spinner, with daily stats and a global leaderboard.
```

**Firefox (max 250 chars):**

```
Tracks how much time you lose waiting for the Dynamics 365 loading spinner. Live timer, daily stats chart, an optional global leaderboard (self-hostable), custom sound alerts, and data export.
```

## Category

- Chrome Web Store: Productivity → Workflow & Planning
- Edge Add-ons: Productivity
- Firefox: Other (or Productivity)

---

## Full description (all stores)

```
How much of your working day goes to the Dynamics 365 loading spinner? Now you'll know.

Dynamics Time Tracker starts a timer whenever the Dynamics 365 loading indicator appears on a *.dynamics.com page and stops it when the indicator goes away. There's nothing to click and nothing to set up. Just keep working (or waiting).

WHAT YOU GET

• Wasted Time Today and Wasted Time Total, updated live
• A live badge on the toolbar icon while the spinner is visible
• Daily stats chart for the last 7, 14 or 30 days, the last year, or all time. Hover a bar to see the exact time for that day.
• Global leaderboard for today, last week and all time. Find out who on your team (or in the world) waits the longest.
• Optional sound alert: choose your own MP3 to play whenever the loading indicator shows up
• English and German interface (follows your browser language by default)
• Export and import all your data as JSON, or delete everything with one click

LEADERBOARD & PRIVACY

The leaderboard is optional. Nothing is uploaded until you choose a display name, and you can turn the leaderboard off completely in the settings.

Only your display name and your wasted-time totals (today, the last 7 days, and all time) are sent. The extension never sends URLs, page content, or any of your Dynamics data.

The leaderboard server is open source and you can host it yourself with Docker. Just enter your own server URL in the settings. Everything else (timers, daily history, your sound file) stays in your browser's local storage.

HOW IT WORKS

Dynamics 365 shows two elements while it's busy: the processing indicator (#ShellProcessingDiv) and the full-page blocking overlay (#ShellBlockingDiv). The extension watches both. While either one is visible, the clock runs.

Open source: https://github.com/Nyyks/dynamics-wasted-time

This extension is not affiliated with, endorsed by, or sponsored by Microsoft. Dynamics 365 is a trademark of Microsoft Corporation.
```

---

## Screenshots

Upload the files from `chrome/store-1280x800/` (Chrome & Edge) or `firefox/store-1280x800/` (Firefox) in this order.
The captions below are for AMO, which lets you caption each screenshot. On Chrome the headline is already part of the image.

| # | File | Caption |
|---|------|---------|
| 1 | `1-popup-overview.jpg` | Live timer for today and in total, plus a warning while the loading indicator is visible. |
| 2 | `2-popup-chart-tooltip.jpg` | Daily stats chart. Hover any bar to see the exact time for that day. |
| 3 | `3-popup-leaderboard-alltime.jpg` | Global leaderboard (today / last week / all time). You still see your own rank when you're outside the top 10. |
| 4 | `4-settings.jpg` | Settings: language, custom sound alert, data export/import, and leaderboard options. |
| 5 | `5-popup-name-banner.jpg` | Set a display name to join the leaderboard, or dismiss the banner and stay off it. |

Small promo tile for Chrome (440×280): `chrome/promo-tile-440x280.jpg`.
Raw, uncropped 2× screenshots of each page are in `*/raw/`.

---

## Chrome Web Store — Privacy tab

**Single purpose:**

```
Measures the time a user spends waiting for the Dynamics 365 loading indicator and shows it as statistics and an optional leaderboard.
```

**Permission justifications:**

- `storage`: Saves the timers, the daily history, the user's settings and the optional notification sound locally.
- Host permission `*://*.dynamics.com/*`: The content script has to see the Dynamics 365 loading indicator elements in order to start and stop the timer. It doesn't read or send any page content.
- Host permissions `https://*/*` and `http://*/*`: Used only to reach the leaderboard server. Users can point the extension at a self-hosted server on any domain, so the address can't be known in advance.

**Remote code:** No, the extension does not use remote code.

**Data usage** (only relevant while the leaderboard is enabled and a display name is set):

- ☑ Website activity: aggregate time spent waiting on Dynamics 365 loading screens (no URLs or page content)
- Also tick the three standard certifications (data isn't sold, isn't used for unrelated purposes, isn't used for creditworthiness).

A privacy policy URL is required once any data is uploaded. The short policy below can be hosted on GitHub Pages or in the repo:

```
Dynamics Time Tracker stores all timing data locally in your browser.

If you enable the leaderboard and set a display name, the extension sends your display name and your wasted-time totals (today, the last 7 days, and all time) to the configured leaderboard server. The default server is https://d365.satan.lgbt, but you can use a server of your own. No URLs, page content or other personal data is ever collected.

If you change your display name, the entry under your old name is deleted from the server. You can stop all uploads at any time by turning off the leaderboard in the settings.

No data is sold or shared with third parties.
```

---

## Firefox (AMO) — reviewer notes

```
The extension only runs its content script on *.dynamics.com. There it checks whether the #ShellProcessingDiv or #ShellBlockingDiv elements are visible to time how long the user waits.

The broad https://*/* and http://*/* host permissions exist only so that users can point the optional leaderboard at a self-hosted server on any domain. The default server is https://d365.satan.lgbt, and its source is in the repository's server/ folder.

Test without a Dynamics account: open the popup to see the local stats and the leaderboard. To see the tracking itself, a Dynamics 365 trial tenant works.
```
