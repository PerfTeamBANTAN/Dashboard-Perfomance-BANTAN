async function initKpiFullfilment(apiUrl) {
  try {
    const res = await fetch(apiUrl + '?action=getKpiFullfilment');
    const data = await res.json();

    // asumsi struktur:
    // data.msa = array dari web!A130:D135
    // data.wsa = array dari web!A138:D143
    // setiap baris: [indikator, target, h_minus1, hi]

    const msa = data.msa || [];
    const wsa = data.wsa || [];
    const periode = data.periode || "-";

    document.getElementById('kpiPeriodeText').innerText = 'Periode: ' + periode;

    renderTable('tblMsaBody', msa);
    renderTable('tblWsaBody', wsa);

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

function renderTable(tbodyId, rows) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';

  rows.forEach(r => {
    const indikator = r[0];
    const targetRaw = r[1];
    const h1Raw = r[2];
    const hiRaw = r[3];

    const target = parseFloat(String(targetRaw).toString().replace(',','.')) || 0;
    const h1 = parseFloat(String(h1Raw).toString().replace('%','').replace(',','.')) || 0;
    const hi = parseFloat(String(hiRaw).toString().replace('%','').replace(',','.')) || 0;

    const isGood = hi >= target;
    const rowClass = isGood ? 'good' : 'bad';
    const valClass = isGood ? 'kpi-good' : 'kpi-bad';

    const tr = document.createElement('tr');
    tr.className = 'kpi-row ' + rowClass;

    tr.innerHTML = `
      <td>${indikator}</td>
      <td class="text-center">${formatNumber(target)}</td>
      <td class="text-center ${valClass}">${formatPercent(h1)}</td>
      <td class="text-center ${valClass}">${formatPercent(hi)}</td>
    `;
    tbody.appendChild(tr);
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
