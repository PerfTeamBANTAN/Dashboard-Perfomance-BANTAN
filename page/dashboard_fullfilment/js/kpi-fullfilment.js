async function initKpiFullfilment(apiUrl) {
  try {
    const res = await fetch(apiUrl + '?action=getkpifullfilment');
    const data = await res.json();

    const msa = data.msa || [];
    const wsa = data.wsa || [];
    const periode = data.periode || "-";

    document.getElementById('kpiPeriodeText').innerText = 'Periode: ' + periode;

    renderKpiCards('msaCardList', msa);
    renderKpiCards('wsaCardList', wsa);

    const msaStats = calcSummary(msa);
    const wsaStats = calcSummary(wsa);

    document.getElementById('msaAvgHminus1').innerText = msaStats.avgH1;
    document.getElementById('msaAvgHI').innerText = msaStats.avgHI;
    document.getElementById('msaOnTarget').innerText = msaStats.onTarget;

    document.getElementById('wsaAvgHminus1').innerText = wsaStats.avgH1;
    document.getElementById('wsaAvgHI').innerText = wsaStats.avgHI;
    document.getElementById('wsaOnTarget').innerText = wsaStats.onTarget;

  } catch (err) {
    console.error(err);
    document.getElementById('content-area').innerHTML = `
      <div class="alert alert-danger">
        Gagal memuat data KPI Fullfilment. Silakan coba lagi.
      </div>`;
  }
}

function renderKpiCards(containerId, rows) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '';

  rows.forEach(r => {
    const indikator = r[0];
    const targetRaw = r[1];
    const h1Raw = r[2];
    const hiRaw = r[3];

    const target = parseFloat(String(targetRaw).toString().replace(',','.')) || 0;
    const h1 = parseFloat(String(h1Raw).toString().replace('%','').replace(',','.')) || 0;
    const hi = parseFloat(String(hiRaw).toString().replace('%','').replace(',','.')) || 0;

    const onTarget = hi >= target;
    const statusClass = onTarget ? 'kpi-status-on' : 'kpi-status-off';
    const statusText = onTarget ? 'ON TARGET' : 'UNDER TARGET';

// progress vs target
    const ratio = target ? Math.min((hi / target) * 100, 130) : 0;

    const card = document.createElement('div');
    card.className = 'kpi-indikator-card ' + (onTarget ? 'good' : 'bad');

    card.innerHTML = `
      <div class="kpi-indikator-header">
        <div class="kpi-indikator-name">${indikator}</div>
        <span class="kpi-status-chip ${statusClass}">${statusText}</span>
      </div>
      <div class="kpi-indikator-body">
        <div class="kpi-mini-metric">
          <span class="kpi-mini-label">Target</span>
          <span class="kpi-mini-value">${formatNumber(target)}</span>
        </div>
        <div class="kpi-mini-metric">
          <span class="kpi-mini-label">H-1</span>
          <span class="kpi-mini-value">${formatPercent(h1)}</span>
        </div>
        <div class="kpi-mini-metric">
          <span class="kpi-mini-label">HI</span>
          <span class="kpi-mini-value">${formatPercent(hi)}</span>
        </div>
      </div>
      <div class="kpi-progress-wrap">
        <div class="kpi-progress-label">
          <span>Progress vs Target</span>
          <span>${formatPercent(hi)} / ${formatNumber(target)}%</span>
        </div>
        <div class="kpi-progress-bar">
          <div class="kpi-progress-fill ${onTarget ? '' : 'bad'}" style="width:${ratio}%;"></div>
        </div>
      </div>
    `;

    wrap.appendChild(card);
  });
}

function calcSummary(rows) {
  let sumH1 = 0;
  let sumHI = 0;
  let count = 0;
  let onTarget = 0;

  rows.forEach(r => {
    const target = parseFloat(String(r[1]).toString().replace(',','.')) || 0;
    const h1 = parseFloat(String(r[2]).toString().replace('%','').replace(',','.')) || 0;
    const hi = parseFloat(String(r[3]).toString().replace('%','').replace(',','.')) || 0;

    if (!isNaN(h1)) sumH1 += h1;
    if (!isNaN(hi)) sumHI += hi;
    count++;
    if (hi >= target) onTarget++;
  });

  return {
    avgH1: count ? formatPercent(sumH1 / count) : '-',
    avgHI: count ? formatPercent(sumHI / count) : '-',
    onTarget: onTarget
  };
}

function formatPercent(val) {
  if (val === '-' || isNaN(val)) return '-';
  return val.toFixed(2) + '%';
}
function formatNumber(val) {
  if (val === '-' || isNaN(val)) return '-';
  return val.toFixed(2);
}

async function initKpiFullfilment(apiUrl) {
  try {
    const res = await fetch(apiUrl + '?action=getkpifullfilment');
    const data = await res.json();

    const msa = data.msa || [];
    const wsa = data.wsa || [];
    const periode = data.periode || "-";
    const stoHeader = data.stoTableHeader || [];
    const stoRows = data.stoTable || [];

    document.getElementById('kpiPeriodeText').innerText = 'Periode: ' + periode;

    renderKpiCards('msaCardList', msa);
    renderKpiCards('wsaCardList', wsa);

    renderStoTable(stoHeader, stoRows);

    const msaStats = calcSummary(msa);
    const wsaStats = calcSummary(wsa);

    document.getElementById('msaAvgHminus1').innerText = msaStats.avgH1;
    document.getElementById('msaAvgHI').innerText = msaStats.avgHI;
    document.getElementById('msaOnTarget').innerText = msaStats.onTarget;

    document.getElementById('wsaAvgHminus1').innerText = wsaStats.avgH1;
    document.getElementById('wsaAvgHI').innerText = wsaStats.avgHI;
    document.getElementById('wsaOnTarget').innerText = wsaStats.onTarget;

  } catch (err) {
    console.error(err);
    document.getElementById('content-area').innerHTML = `
      <div class="alert alert-danger">
        Gagal memuat data KPI Fullfilment. Silakan coba lagi.
      </div>`;
  }
}
