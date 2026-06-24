let chartMeta = null;

async function updateUI() {
  const data = await browser.storage.local.get(['todaySeconds', 'totalSeconds', 'lastReset']);

  document.getElementById('todayTime').textContent = formatTime(data.todaySeconds || 0);
  document.getElementById('totalTime').textContent = formatTime(data.totalSeconds || 0);

  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  if (currentTab?.url?.includes('dynamics.com')) {
    document.getElementById('statusText').textContent = 'On Dynamics.com';
    try {
      const response = await browser.tabs.sendMessage(currentTab.id, { action: 'getLoadingStatus' });
      document.getElementById('loadingIndicator').style.display = response?.isVisible ? 'block' : 'none';
    } catch (e) {
      document.getElementById('loadingIndicator').style.display = 'none';
    }
  } else {
    document.getElementById('statusText').textContent = 'Not on Dynamics.com';
    document.getElementById('loadingIndicator').style.display = 'none';
  }
}

function formatYLabel(seconds) {
  if (seconds === 0) return '0';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function renderChart() {
  const data = await browser.storage.local.get(['dailyData']);
  const dailyData = data.dailyData || {};
  const timespanValue = document.getElementById('timespanSelect').value;

  let dates = [];
  if (timespanValue === 'all') {
    const allDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));
    if (allDates.length === 0) {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toDateString());
      }
    } else {
      const cursor = new Date(allDates[0]);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      while (cursor <= today) {
        dates.push(cursor.toDateString());
        cursor.setDate(cursor.getDate() + 1);
      }
    }
  } else {
    const days = parseInt(timespanValue);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toDateString());
    }
  }

  const values = dates.map(d => dailyData[d] || 0); // seconds

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
  const n = dates.length;

  ctx.clearRect(0, 0, cssWidth, cssHeight);

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
    ctx.fillText(formatYLabel(maxVal * i / 4), pad.left - 4, y + 3);
  }

  const today = new Date().toDateString();
  const step = n <= 7 ? 1 : n <= 14 ? 2 : n <= 31 ? 3 : Math.ceil(n / 12);

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
    ctx.fillRect(x + 1, y, Math.max(barW - 2, 1), barH);

    if (i % step === 0 || i === dates.length - 1) {
      const d = new Date(dates[i]);
      const label = n <= 7
        ? d.toLocaleDateString('en', { weekday: 'short' })
        : n <= 60
        ? `${d.getMonth() + 1}/${d.getDate()}`
        : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      ctx.fillStyle = isToday ? '#e67e22' : '#999';
      ctx.font = isToday ? 'bold 9px sans-serif' : '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barW / 2, cssHeight - pad.bottom + 12);
    }
  });

  chartMeta = { dates, values, pad, barW, cssWidth, cssHeight };
}

function setupTooltip() {
  const canvas = document.getElementById('statsChart');
  const tooltip = document.getElementById('chartTooltip');

  canvas.addEventListener('mousemove', (e) => {
    if (!chartMeta) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { dates, values, pad, barW, cssHeight } = chartMeta;

    const idx = Math.floor((mouseX - pad.left) / barW);
    const inChartArea = mouseX >= pad.left && mouseY >= pad.top && mouseY <= cssHeight - pad.bottom;

    if (inChartArea && idx >= 0 && idx < dates.length) {
      const d = new Date(dates[idx]);
      const seconds = values[idx];
      const dateLabel = d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
      tooltip.textContent = `${dateLabel}: ${formatTime(seconds)}`;
      tooltip.style.display = 'block';

      const wrapRect = canvas.parentElement.getBoundingClientRect();
      let tx = e.clientX - wrapRect.left + 10;
      let ty = e.clientY - wrapRect.top - 36;
      if (tx + 160 > wrapRect.width) tx = e.clientX - wrapRect.left - 170;
      tooltip.style.left = tx + 'px';
      tooltip.style.top = Math.max(ty, 2) + 'px';
    } else {
      tooltip.style.display = 'none';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });
}

document.getElementById('resetTodayBtn').addEventListener('click', async () => {
  if (confirm("Reset today's wasted time?")) {
    await browser.storage.local.set({ todaySeconds: 0 });
    updateUI();
    renderChart();
  }
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  browser.runtime.openOptionsPage();
});

document.getElementById('timespanSelect').addEventListener('change', renderChart);

updateUI();
renderChart();
setupTooltip();
setInterval(updateUI, 1000);
setInterval(renderChart, 5000);
