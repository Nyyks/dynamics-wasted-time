async function updateUI() {
  const data = await chrome.storage.local.get(['todaySeconds', 'totalSeconds', 'lastReset']);

  document.getElementById('todayTime').textContent = formatTime(data.todaySeconds || 0);
  document.getElementById('totalTime').textContent = formatTime(data.totalSeconds || 0);

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  if (currentTab?.url?.includes('dynamics.com')) {
    document.getElementById('statusText').textContent = 'On Dynamics.com';
    try {
      const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'getLoadingStatus' });
      document.getElementById('loadingIndicator').style.display = response?.isVisible ? 'block' : 'none';
    } catch (e) {
      document.getElementById('loadingIndicator').style.display = 'none';
    }
  } else {
    document.getElementById('statusText').textContent = 'Not on Dynamics.com';
    document.getElementById('loadingIndicator').style.display = 'none';
  }
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function renderChart() {
  const data = await chrome.storage.local.get(['dailyData']);
  const dailyData = data.dailyData || {};
  const days = parseInt(document.getElementById('timespanSelect').value);

  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toDateString());
  }

  const values = dates.map(d => (dailyData[d] || 0) / 60);

  const canvas = document.getElementById('statsChart');
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.offsetWidth;
  const cssHeight = 140;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.height = cssHeight + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { top: 10, right: 8, bottom: 28, left: 36 };
  const chartW = cssWidth - pad.left - pad.right;
  const chartH = cssHeight - pad.top - pad.bottom;
  const maxVal = Math.max(...values, 1);
  const barW = chartW / dates.length;

  ctx.clearRect(0, 0, cssWidth, cssHeight);

  // Grid lines + Y labels
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#aaa';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    const label = maxVal * i / 4;
    ctx.fillText(label >= 60 ? `${(label / 60).toFixed(1)}h` : `${Math.round(label)}m`, pad.left - 4, y + 3);
  }

  const today = new Date().toDateString();
  values.forEach((val, i) => {
    const x = pad.left + i * barW;
    const barH = Math.max((val / maxVal) * chartH, val > 0 ? 2 : 0);
    const y = pad.top + chartH - barH;

    const isToday = dates[i] === today;
    if (isToday) {
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, '#f39c12');
      grad.addColorStop(1, '#e67e22');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(1, '#764ba2');
      ctx.fillStyle = grad;
    }
    ctx.fillRect(x + 2, y, barW - 4, barH);

    // X labels: show every N-th to avoid crowding
    const step = days <= 7 ? 1 : days <= 14 ? 2 : Math.ceil(days / 10);
    if (i % step === 0 || i === dates.length - 1) {
      const d = new Date(dates[i]);
      const label = days <= 7
        ? d.toLocaleDateString('en', { weekday: 'short' })
        : `${d.getMonth() + 1}/${d.getDate()}`;
      ctx.fillStyle = isToday ? '#e67e22' : '#999';
      ctx.font = isToday ? 'bold 9px sans-serif' : '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barW / 2, cssHeight - pad.bottom + 12);
    }
  });
}

document.getElementById('resetTodayBtn').addEventListener('click', async () => {
  if (confirm("Reset today's wasted time?")) {
    await chrome.storage.local.set({ todaySeconds: 0 });
    updateUI();
    renderChart();
  }
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('timespanSelect').addEventListener('change', renderChart);

updateUI();
renderChart();
setInterval(updateUI, 1000);
setInterval(renderChart, 5000);
