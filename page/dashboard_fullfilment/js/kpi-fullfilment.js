async function initKpiFullfilment(apiUrl) {
  try {
    const res = await fetch(apiUrl + '?action=getkpifullfilment');
    const data = await res.json();

    // ====== DATA DARI API ======
    const msa       = data.msa || [];
    const wsa       = data.wsa || [];
    const periode   = data.periode || "-";

    const stoHeader = data.stoTableHeader || [];
    const stoRows   = data.stoTable || [];

    const hiHeader  = data.hiTableHeader || [];
    const hiRows    = data.hiTable || [];

    // ====== SET PERIODE ======
    const periodeEl = document.getElementById('kpiPeriodeText');
    if (periodeEl) {
      periodeEl.innerText = 'Periode: ' + periode;
    }

    // ====== CARD KPI PER INDIKATOR (MSA & WSA) ======
    renderKpiCards('msaCardList', msa);
    renderKpiCards('wsaCardList', wsa);

    // ====== TABEL STO (WEB!A110:J124) ======
    renderStoTable(stoHeader, stoRows);

    // ====== TABEL FULLFILMENT HI ('fullfilment HI'!B2:AC18) ======
    renderHiTable(hiHeader, hiRows);

    // ====== SUMMARY KPI MSA & WSA ======
    const msaStats = calcSummary(msa);
    const wsaStats = calcSummary(wsa);

    const msaAvgH1El  = document.getElementById('msaAvgHminus1');
    const msaAvgHIEl  = document.getElementById('msaAvgHI');
    const msaOnTargetEl = document.getElementById('msaOnTarget');

    const wsaAvgH1El  = document.getElementById('wsaAvgHminus1');
    const wsaAvgHIEl  = document.getElementById('wsaAvgHI');
    const wsaOnTargetEl = document.getElementById('wsaOnTarget');

    if (msaAvgH1El)  msaAvgH1El.innerText  = msaStats.avgH1;
    if (msaAvgHIEl)  msaAvgHIEl.innerText  = msaStats.avgHI;
    if (msaOnTargetEl) msaOnTargetEl.innerText = msaStats.onTarget;

    if (wsaAvgH1El)  wsaAvgH1El.innerText  = wsaStats.avgH1;
    if (wsaAvgHIEl)  wsaAvgHIEl.innerText  = wsaStats.avgHI;
    if (wsaOnTargetEl) wsaOnTargetEl.innerText = wsaStats.onTarget;

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

function renderHiTable(headerRow, rows) {
  const thead = document.getElementById('kpiHiThead');
  const tbody = document.getElementById('kpiHiTbody');
  if (!thead || !tbody) return;

  // ===== HEADER =====
  thead.innerHTML = '';
  const trHead = document.createElement('tr');

  const customHeaders = [
    'STO',               // kolom 0
    'Telkomsel Cluster', // kolom 1
    'PIC / Kontrak'      // kolom 2
  ];

  customHeaders.forEach((h, idx) => {
    const th = document.createElement('th');
    const span = document.createElement('span');
    span.textContent = h;
    span.style.display = 'block';
    span.style.whiteSpace = 'normal';
    span.style.lineHeight = '1.1';
    th.appendChild(span);

    th.style.fontSize = '0.72rem';
    th.style.verticalAlign = 'middle';
    th.style.minWidth = idx === 0 ? '70px' : '100px';
    th.style.maxWidth = idx === 0 ? '80px' : '110px';

    trHead.appendChild(th);
  });

  // header sisanya dari sheet mulai index 3
  headerRow.forEach((h, idx) => {
    if (idx < 3) return; // B:D sudah custom

    const th = document.createElement('th');
    const span = document.createElement('span');
    span.textContent = h;
    span.style.display = 'block';
    span.style.whiteSpace = 'normal';
    span.style.lineHeight = '1.1';
    th.appendChild(span);

    th.style.fontSize = '0.72rem';
    th.style.verticalAlign = 'middle';
    th.style.minWidth = '90px';
    th.style.maxWidth = '110px';
    th.classList.add('text-center');

    trHead.appendChild(th);
  });

  thead.appendChild(trHead);

  // ===== BODY =====
  tbody.innerHTML = '';

  rows.forEach((r, rowIndex) => {
    const rawSto      = String(r[0] || '');
    const kecukupan   = String(r[20] || '').toUpperCase();
    const psreKproRaw = r[26];

    // DETECT row total / branch dari nilai asli (bukan mapping)
    const isTotal  = rawSto.toUpperCase().includes('TOTAL');
    const isBranch = rawSto.toUpperCase().includes('BRANCH');

    // ===== REKONSTRUKSI B:D (STO, Cluster, PIC) =====
    let stoLabel     = '';
    let clusterLabel = '';
    let picLabel     = '';

    switch (rowIndex) {
      case 0:  stoLabel = 'GDS';   clusterLabel = 'KOTANG';   picLabel = 'DADY';      break;
      case 1:  stoLabel = 'TAN';   clusterLabel = '';         picLabel = 'DADY';      break;
      case 2:  stoLabel = 'JIA';   clusterLabel = '';         picLabel = 'DADY';      break;
      case 3:  stoLabel = 'CLD';   clusterLabel = '';         picLabel = 'EKA';       break;
      case 4:  stoLabel = 'CPD';   clusterLabel = '';         picLabel = 'RISMAN';    break;
      case 5:  stoLabel = 'CKL';   clusterLabel = '';         picLabel = 'RISMAN';    break;
      case 6:  stoLabel = 'DTG';   clusterLabel = '';         picLabel = 'RISMAN';    break;
      case 7:  stoLabel = 'Total KOTANG'; clusterLabel = 'KOTANG'; picLabel = '';     break;
      case 8:  stoLabel = 'PDR';   clusterLabel = 'TANGSEL';  picLabel = 'EKA';       break;
      case 9:  stoLabel = 'PKU';   clusterLabel = '';         picLabel = 'EKA';       break;
      case 10: stoLabel = 'LKG';   clusterLabel = '';         picLabel = 'HERLANDO';  break;
      case 11: stoLabel = 'SRP';   clusterLabel = '';         picLabel = 'HERLANDO';  break;
      case 12: stoLabel = 'SRH';   clusterLabel = '';         picLabel = 'ZULFA';     break;
      case 13: stoLabel = 'CPA';   clusterLabel = '';         picLabel = 'ZULFA';     break;
      case 14: stoLabel = 'Total TANGSEL'; clusterLabel = 'TANGSEL'; picLabel = '';   break;
      case 15: stoLabel = 'Branch TANGERANG'; clusterLabel = 'Branch TANGERANG'; picLabel = ''; break;
      default: stoLabel = rawSto; break;
    }

    const tr = document.createElement('tr');
    if (isTotal)  tr.classList.add('kpi-hi-row-total');
    if (isBranch) tr.classList.add('kpi-hi-row-branch');

    // ===== kolom 0: STO =====
    {
      const td = document.createElement('td');
      td.textContent = stoLabel;
      td.classList.add('kpi-sto-name');
      tr.appendChild(td);
    }

    // ===== kolom 1: Cluster =====
    {
      const td = document.createElement('td');
      td.textContent = clusterLabel;
      tr.appendChild(td);
    }

    // ===== kolom 2: PIC =====
    {
      const td = document.createElement('td');
      td.textContent = picLabel;
      tr.appendChild(td);
    }

    // ===== kolom 3.. (ambil dari r[3..] dengan formatting angka) =====
    r.forEach((val, idx) => {
      if (idx < 3) return;

      const td = document.createElement('td');
      let text = val;

      // kolom rasio/desimal → 2 decimal
      const decimalCols = [7, 8, 13, 14, 21, 22, 25, 26];
      if (decimalCols.includes(idx)) {
        const num = parseFloat(val);
        text = (!isNaN(num)) ? num.toFixed(2) : val;
      }

      // %PS/RE KPRO (26) → tambahkan '%'
      if (idx === 26) {
        const num = parseFloat(val);
        text = (!isNaN(num)) ? num.toFixed(2) + '%' : val;
      }

      td.textContent = (text === undefined || text === null) ? '' : text;
      td.classList.add('text-center');

      // KECUKUPAN TEAM (kolom 20)
      if (idx === 20) {
        const good = kecukupan === 'CUKUP';
        td.classList.add(good ? 'kpi-hi-cell-kecukupan-good' : 'kpi-hi-cell-kecukupan-bad');
      }

      // %PS/RE KPRO (kolom 26)
      if (idx === 26) {
        const num = parseFloat(psreKproRaw);
        const good = !isNaN(num) && num >= 0.75; // contoh threshold 75%
        td.classList.add(good ? 'kpi-hi-cell-psre-good' : 'kpi-hi-cell-psre-bad');
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function renderStoTable(headerRow, rows) {
  const thead = document.getElementById('kpiStoThead');
  const tbody = document.getElementById('kpiStoTbody');
  if (!thead || !tbody) return;

  // HEADER
  thead.innerHTML = '';
  const trHead = document.createElement('tr');
  headerRow.forEach((h, idx) => {
    const th = document.createElement('th');
    th.textContent = h;
    if (idx === 0) th.style.minWidth = '70px';
    if (idx > 0) th.classList.add('text-center');
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);

  // BODY
  tbody.innerHTML = '';

  rows.forEach(r => {
    const sto = r[0];
    const deviasiRaw = r[9]; // kolom J
    const devStr = String(deviasiRaw || '');
    const isBranch = String(sto || '').toUpperCase().includes('BRANCH');

    // ambil angka deviasi (bisa "9 PS", "13 PS", "0 PS", "100 PS")
    const devNum = parseFloat(devStr.replace(/[^\d.-]/g, '')) || 0;
    const good = devNum <= 0; // kalau Deviasi <= 0 artinya sudah meet/above target

    const tr = document.createElement('tr');
    if (isBranch) tr.classList.add('kpi-row-branch');

    r.forEach((val, idx) => {
      const td = document.createElement('td');
      const text = val === undefined || val === null ? '' : val;

      if (idx === 0) {
        td.textContent = text;
        td.classList.add('kpi-sto-name');
      } else if (idx === 1 || idx === 2 || idx === 3 || idx === 4 || idx === 5 || idx === 6) {
        td.classList.add('text-center');
        td.textContent = text;
      } else if (idx === 7 || idx === 8) {
        // % kolom gross/nett
        td.classList.add('text-center');
        td.textContent = text;
      } else if (idx === 9) {
        td.classList.add('text-center');
        td.textContent = text;
        td.classList.add(good ? 'kpi-cell-good' : 'kpi-cell-bad');
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}
