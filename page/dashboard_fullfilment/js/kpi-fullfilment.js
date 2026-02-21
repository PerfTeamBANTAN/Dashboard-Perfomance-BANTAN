// 🔹 Global untuk dipakai semua fungsi
let kpiApiUrl = '';
let modalRows = [];
let modalPage = 1;
const MODAL_PER_PAGE = 10;

async function initKpiFullfilment(apiUrl) {
  kpiApiUrl = apiUrl; // simpan URL web app

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

    const kendalaHeader = data.kendalaHeader || [];
    const kendalaRows   = data.kendalaTable || [];

    const hsaProdukHeader = data.hsaProdukHeader || [];
    const hsaProdukRows   = data.hsaProdukTable || [];

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

    // ====== TABEL KENDALA (WEB!A145:F159) DI SIDE CONTENT ======
    renderKendalaTable(kendalaHeader, kendalaRows);

    // ====== TABEL HSA PER PRODUK (WEB!A165:K179) ======
    renderHsaProdukTable(hsaProdukHeader, hsaProdukRows);

    // ====== SUMMARY KPI MSA & WSA ======
    const msaStats = calcSummary(msa);
    const wsaStats = calcSummary(wsa);

    const msaAvgH1El    = document.getElementById('msaAvgHminus1');
    const msaAvgHIEl    = document.getElementById('msaAvgHI');
    const msaOnTargetEl = document.getElementById('msaOnTarget');

    const wsaAvgH1El    = document.getElementById('wsaAvgHminus1');
    const wsaAvgHIEl    = document.getElementById('wsaAvgHI');
    const wsaOnTargetEl = document.getElementById('wsaOnTarget');

    if (msaAvgH1El)    msaAvgH1El.innerText    = msaStats.avgH1;
    if (msaAvgHIEl)    msaAvgHIEl.innerText    = msaStats.avgHI;
    if (msaOnTargetEl) msaOnTargetEl.innerText = msaStats.onTarget;

    if (wsaAvgH1El)    wsaAvgH1El.innerText    = wsaStats.avgH1;
    if (wsaAvgHIEl)    wsaAvgHIEl.innerText    = wsaStats.avgHI;
    if (wsaOnTargetEl) wsaOnTargetEl.innerText = wsaStats.onTarget;

    setKendalaMonthBadge();
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

  // ===== HEADER: murni dari sheet =====
  thead.innerHTML = '';
  const trHead = document.createElement('tr');

  headerRow.forEach((h, idx) => {
    const th = document.createElement('th');
    const span = document.createElement('span');
    span.textContent = h;
    span.style.display = 'block';
    span.style.whiteSpace = 'normal';
    span.style.lineHeight = '1.1';
    th.appendChild(span);

    th.style.fontSize = '0.72rem';
    th.style.verticalAlign = 'middle';

    if (idx === 0) {
      th.style.minWidth = '70px';
      th.style.maxWidth = '90px';
    } else if (idx === 1) {
      th.style.minWidth = '90px';
      th.style.maxWidth = '110px';
    } else if (idx === 2) {
      th.style.minWidth = '90px';
      th.style.maxWidth = '110px';
    } else {
      th.style.minWidth = '90px';
      th.style.maxWidth = '110px';
      th.classList.add('text-center');
    }

    trHead.appendChild(th);
  });
  thead.appendChild(trHead);

  // ===== BODY: murni rows, hanya formatting angka & highlight =====
  tbody.innerHTML = '';

  rows.forEach(r => {
    const rawSto      = String(r[0] || '');
    const kecukupan   = String(r[20] || '').toUpperCase();
    const psreKproRaw = r[26];

    const isTotal  = rawSto.toUpperCase().includes('TOTAL');
    const isBranch = rawSto.toUpperCase().includes('BRANCH');

    const tr = document.createElement('tr');
    if (isTotal)  tr.classList.add('kpi-hi-row-total');
    if (isBranch) tr.classList.add('kpi-hi-row-branch');

    r.forEach((val, idx) => {
      const td = document.createElement('td');
      let text = val;

      // kolom rasio/desimal → 2 decimal
      const decimalCols = [7, 8, 13, 14, 21, 22, 25, 26];
      if (decimalCols.includes(idx)) {
        const num = parseFloat(val);
        text = (!isNaN(num)) ? num.toFixed(2) : val;
      }

      // %PS/RE KPRO (26) → tampilkan dengan '%'
      if (idx === 26) {
        const num = parseFloat(val);
        text = (!isNaN(num)) ? num.toFixed(2) + '%' : val;
      }

      td.textContent = (text === undefined || text === null) ? '' : text;

      // alignment: 3 kolom pertama kiri, sisanya center
      if (idx <= 2) {
        if (idx === 0) td.classList.add('kpi-sto-name');
      } else {
        td.classList.add('text-center');
      }

      if (idx === 20) {
        const good = kecukupan === 'CUKUP';
        td.classList.add(good ? 'kpi-hi-cell-kecukupan-good' : 'kpi-hi-cell-kecukupan-bad');
      }

      if (idx === 26) {
        const num = parseFloat(psreKproRaw);
        const good = !isNaN(num) && num >= 0.75;
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

  // ===== HEADER =====
  thead.innerHTML = '';
  const trHead = document.createElement('tr');

  headerRow.forEach((h, idx) => {
    const th = document.createElement('th');

    // bungkus agar bisa multi-line & rata
    const span = document.createElement('span');
    span.textContent = h;
    span.style.display = 'block';
    span.style.whiteSpace = 'normal';
    span.style.lineHeight = '1.1';
    th.appendChild(span);

    th.style.fontSize = '0.75rem';
    th.style.verticalAlign = 'middle';

    // lebar konsisten
    if (idx === 0) {                // STO
      th.style.minWidth = '80px';
      th.style.maxWidth = '90px';
    } else if (idx === 1) {         // HSA
      th.style.minWidth = '80px';
      th.style.maxWidth = '90px';
    } else if (idx >= 2 && idx <= 6) { // TOTAL RE, RE CANCEL, RE NETT, PI, PS
      th.style.minWidth = '90px';
      th.style.maxWidth = '100px';
    } else {                        // %PS/RE GROSS, %PS/RE NETT, Deviasi
      th.style.minWidth = '110px';
      th.style.maxWidth = '120px';
    }

    if (idx > 0) th.classList.add('text-center');

    trHead.appendChild(th);
  });

  thead.appendChild(trHead);

  tbody.innerHTML = '';

  rows.forEach(r => {
    const sto = r[0];
    const deviasiRaw = r[9]; // kolom J
    const devStr = String(deviasiRaw || '');
    const isBranch = String(sto || '').toUpperCase().includes('BRANCH');

    // ambil angka deviasi (bisa "9 PS", "13 PS", "0 PS", "100 PS")
    const devNum = parseFloat(devStr.replace(/[^\d.-]/g, '')) || 0;
    const goodDev = devNum <= 0; // Deviasi <= 0 = good

    const tr = document.createElement('tr');
    if (isBranch) tr.classList.add('kpi-row-branch');

    r.forEach((val, idx) => {
      const td = document.createElement('td');
      let text = (val === undefined || val === null) ? '' : val;

      if (idx === 7 || idx === 8) {
        const num = parseFloat(String(val).replace('%','').replace(',','.'));
        text = (!isNaN(num)) ? num.toFixed(2) + '%' : val;
      }

      if (idx === 0) {
        td.textContent = text;
        td.classList.add('kpi-sto-name');
      } else if (idx >= 1 && idx <= 6) {
        td.classList.add('text-center');
        td.textContent = text;
      } else if (idx === 7 || idx === 8) {
        td.classList.add('text-center');
        td.textContent = text;
      } else if (idx === 9) {
        td.classList.add('text-center');
        td.textContent = text;
        td.classList.add(goodDev ? 'kpi-cell-good' : 'kpi-cell-bad');
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function renderKendalaTable(headerRow, rows) {
  const thead = document.getElementById('kpiKendalaThead');
  const tbody = document.getElementById('kpiKendalaTbody');
  if (!thead || !tbody) return;

  // ===== HEADER =====
  thead.innerHTML = '';
  const trHead = document.createElement('tr');

  headerRow.forEach((h, idx) => {
    // 0: STO, 1: HSA, 2: RE(CAN+FO), 3: KP, 4: KT, 5: KENDALA LAINNYA
    if (idx >= 0 && idx <= 5) {
      const th = document.createElement('th');
      const span = document.createElement('span');
      span.textContent = h;
      span.style.display = 'block';
      span.style.whiteSpace = 'normal';
      span.style.lineHeight = '1.1';
      th.appendChild(span);

      th.style.fontSize = '0.72rem';
      th.style.verticalAlign = 'middle';
      th.style.minWidth = (idx === 0) ? '70px' : '90px';
      if (idx >= 2) th.classList.add('text-center');

      trHead.appendChild(th);
    }
  });
  thead.appendChild(trHead);

  // ===== BODY =====
  tbody.innerHTML = '';
  rows.forEach(r => {
    const sto = r[0];
    const hsa = r[1];
    const isBranch = String(sto || '').toUpperCase().includes('BRANCH');

    const tr = document.createElement('tr');
    if (isBranch) tr.classList.add('kpi-kendala-row-branch');

    // STO
    const tdSto = document.createElement('td');
    tdSto.textContent = sto || '';
    tdSto.classList.add('kpi-sto-name');
    tr.appendChild(tdSto);

    // HSA
    const tdHsa = document.createElement('td');
    tdHsa.textContent = hsa || '';
    tr.appendChild(tdHsa);

    // helper: cell angka yang bisa diklik (PAKAI SPINNER)
    function makeClickableCell(value, label, typeKey) {
      const td = document.createElement('td');
      const count = Number(value) || 0;
      td.textContent = count;
      td.classList.add('text-center');

      if (count > 0 && !isBranch) {
        td.classList.add('kpi-kendala-clickable');
        td.style.cursor = 'pointer';
        td.addEventListener('click', async () => {
          // prevent double-click saat loading
          if (td.classList.contains('loading')) return;

          td.classList.add('loading');
          const originalText = td.textContent;
          td.innerHTML = `
            <div class="kpi-modal-loading">
              <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <span>${originalText}</span>
            </div>
          `;

          try {
            await openKendalaModal({
              sto,
              hsa,
              label,
              typeKey,  // 'RE_CANFO', 'KENDALA_PELANGGAN', dst
              count
            });
          } finally {
            td.classList.remove('loading');
            td.textContent = originalText;
          }
        });
      }
      return td;
    }

    // RE(CAN+FO)
    tr.appendChild(makeClickableCell(r[2], 'RE(CAN+FO)', 'RE_CANFO'));
    // KENDALA PELANGGAN
    tr.appendChild(makeClickableCell(r[3], 'KENDALA PELANGGAN', 'KENDALA_PELANGGAN'));
    // KENDALA TEKNIS
    tr.appendChild(makeClickableCell(r[4], 'KENDALA TEKNIS', 'KENDALA_TEKNIS'));
    // KENDALA LAINNYA
    tr.appendChild(makeClickableCell(r[5], 'KENDALA LAINNYA', 'KENDALA_LAINNYA'));

    tbody.appendChild(tr);
  });
}

async function openKendalaModal({ sto, hsa, label, typeKey, count }) {
  const titleEl    = document.getElementById('kendalaModalLabel');
  const stoEl      = document.getElementById('kendalaSto');
  const hsaEl      = document.getElementById('kendalaHsa');
  const summaryEl  = document.getElementById('kendalaDetailSummary');
  const contentEl  = document.getElementById('kendalaDetailContent');

  if (titleEl) titleEl.textContent = `Detail ${label}`;
  if (stoEl)   stoEl.textContent   = sto || '-';
  if (hsaEl)   hsaEl.textContent   = hsa || '-';

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="d-flex align-items-center justify-content-between flex-wrap">
        <div>
          <div class="text-muted small mb-1">Ringkasan</div>
          <div class="fw-semibold">${label} - STO ${sto || '-'}</div>
        </div>
        <div class="text-end">
          <div class="kpi-modal-chip-count">
            <span class="kpi-chip-label">Total WO</span>
            <span class="kpi-chip-value">${count}</span>
          </div>
        </div>
      </div>
    `;
  }

  if (contentEl) {
    contentEl.innerHTML = `
      <div class="py-4 text-center text-muted small">
        <div class="kpi-modal-loading">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <span>Memuat data (${count} data)...</span>
        </div>
      </div>`;
  }

  try {
    let url;
    if (typeKey === 'INDIBIZ') {
      // INDIBIZ → API khusus dari sheet INDIBIZ
      url = kpiApiUrl + `?action=getkpiindibizdetail&sto=${encodeURIComponent(sto)}`;
    } else if (typeKey === 'DATIN') {
      // DATIN → API khusus dari sheet DATIN
      url = kpiApiUrl + `?action=getkpidatindetail&sto=${encodeURIComponent(sto)}`;
    } else if (typeKey === 'WIFI') {
      // WIFI → API khusus dari sheet WIFI
      // Saat ini getWifiDetail filter by order_id; di sini dikirim kosong (ambil semua sesuai logika backend).
      url = kpiApiUrl + `?action=getwifidetail&order_id=`;
    } else {
      // default: PS/RE (RE_CANFO, KP, KT, INDIHOME_PS, dst)
      url = kpiApiUrl + `?action=getkpipsredetail&sto=${encodeURIComponent(sto)}&type=${encodeURIComponent(typeKey)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    modalRows = data.data || [];
    modalPage = 1;

    if (summaryEl) {
      summaryEl.querySelector('.kpi-chip-value').textContent = modalRows.length;
    }

    renderKendalaTablePage(typeKey);
  } catch (err) {
    console.error(err);
    if (contentEl) {
      contentEl.innerHTML = `<p class="text-danger small mb-0">Gagal memuat detail. Silakan coba lagi.</p>`;
    }
  }

  const modalEl = document.getElementById('kendalaModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}


    renderKendalaTablePage(typeKey);
  } catch (err) {
    console.error(err);
    if (contentEl) {
      contentEl.innerHTML = `<p class="text-danger small mb-0">Gagal memuat detail. Silakan coba lagi.</p>`;
    }
  }

  const modalEl = document.getElementById('kendalaModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

function renderKendalaTablePage(typeKey = 'RE_CANFO') {
  const contentEl = document.getElementById('kendalaDetailContent');
  if (!contentEl) return;

  const total = modalRows.length;
  const perPage = MODAL_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (modalPage > totalPages) modalPage = totalPages;

  const start = (modalPage - 1) * perPage;
  const end   = start + perPage;
  const pageItems = modalRows.slice(start, end);

  let html = '';

  if (!pageItems.length) {
    html = `
      <div class="text-center py-4 text-muted small">
        Tidak ada data untuk kombinasi ini.
      </div>`;
  } else {
    // build pagination
    const maxButtons = 7;
    let pageButtonsHtml = '';
    if (totalPages <= maxButtons) {
      pageButtonsHtml = Array.from({ length: totalPages }).map((_, i) => `
        <li class="page-item ${modalPage === (i+1) ? 'active' : ''}">
          <button class="page-link" type="button" data-page="${i+1}">${i+1}</button>
        </li>
      `).join('');
    } else {
      const pages = [];
      pages.push(1);
      const startPage = Math.max(2, modalPage - 1);
      const endPage   = Math.min(totalPages - 1, modalPage + 1);
      if (startPage > 2) pages.push('...');
      for (let p = startPage; p <= endPage; p++) pages.push(p);
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
      pageButtonsHtml = pages.map(p => {
        if (p === '...') {
          return `<li class="page-item disabled"><span class="page-link">…</span></li>`;
        }
        return `
          <li class="page-item ${modalPage === p ? 'active' : ''}">
            <button class="page-link" type="button" data-page="${p}">${p}</button>
          </li>`;
      }).join('');
    }

    // ===== table head & body tergantung typeKey =====
    let theadHtml = '';
    let tbodyHtml = '';

    if (typeKey === 'INDIBIZ') {
      // layout khusus INDIBIZ
      theadHtml = `
        <tr>
          <th class="text-center">#</th>
          <th>ORDER ID</th>
          <th>STO</th>
          <th>STATUS RESUME</th>
          <th>ORDER DATE</th>
          <th>CUSTOMER NAME</th>
          <th>MITRA</th>
        </tr>`;
      tbodyHtml = pageItems.map((r, idx) => `
        <tr>
          <td class="text-center text-muted small">${start + idx + 1}</td>
          <td class="fw-semibold">${r.ORDERID || ''}</td>
          <td class="small">${r.STO || ''}</td>
          <td class="small">${r.STATUS || ''}</td>
          <td class="text-nowrap small">${r.ORDERDATE || ''}</td>
          <td class="small">${r.CUSTNAME || ''}</td>
          <td class="small text-muted">${r.MITRA || ''}</td>
        </tr>
      `).join('');
    } else if (typeKey === 'DATIN') {
      // layout khusus DATIN
      theadHtml = `
        <tr>
          <th class="text-center">#</th>
          <th>ORDER ID</th>
          <th>ORDER DATE</th>
          <th>WORKZONE</th>
          <th>PRODUCT</th>
          <th>CUSTOMER NAME</th>
          <th>MITRA</th>
        </tr>`;
      tbodyHtml = pageItems.map((r, idx) => `
        <tr>
          <td class="text-center text-muted small">${start + idx + 1}</td>
          <td class="fw-semibold">${r.ORDERID || ''}</td>
          <td class="text-nowrap small">${r.ORDERDATE || ''}</td>
          <td class="small">${r.WORKZONE || ''}</td>
          <td class="small">${r.PRODUCT || ''}</td>
          <td class="small">${r.CUSTNAME || ''}</td>
          <td class="small text-muted">${r.MITRA || ''}</td>
        </tr>
      `).join('');
    } else if (typeKey === 'WIFI') {
      // layout khusus WIFI (ORDERID, ORDERDATE, WORKZONE, PRODUCTGROUP, CUSTNAME, MITRA)
      theadHtml = `
        <tr>
          <th class="text-center">#</th>
          <th>ORDER ID</th>
          <th>ORDER DATE</th>
          <th>WORKZONE</th>
          <th>PRODUCT GROUP</th>
          <th>CUSTOMER NAME</th>
          <th>MITRA</th>
        </tr>`;
      tbodyHtml = pageItems.map((r, idx) => `
        <tr>
          <td class="text-center text-muted small">${start + idx + 1}</td>
          <td class="fw-semibold">${r.ORDERID || ''}</td>
          <td class="text-nowrap small">${r.ORDERDATE || ''}</td>
          <td class="small">${r.WORKZONE || ''}</td>
          <td class="small">${r.PRODUCTGROUP || ''}</td>
          <td class="small">${r.CUSTNAME || ''}</td>
          <td class="small text-muted">${r.MITRA || ''}</td>
        </tr>
      `).join('');
    } else {
      // layout default PS/RE
      theadHtml = `
        <tr>
          <th class="text-center">#</th>
          <th>WONUM</th>
          <th>STATUS</th>
          <th>DATE CREATED</th>
          <th>STATUS DATE</th>
          <th>ERROR</th>
          <th>SUB ERROR</th>
        </tr>`;
      tbodyHtml = pageItems.map((r, idx) => `
        <tr>
          <td class="text-center text-muted small">${start + idx + 1}</td>
          <td class="fw-semibold">${r.WONUM || ''}</td>
          <td>
            <span class="badge bg-${(r.STATUS || '').includes('CANCEL') ? 'danger' : 'success'} bg-opacity-10 text-${
              (r.STATUS || '').includes('CANCEL') ? 'danger' : 'success'
            } border border-${(r.STATUS || '').includes('CANCEL') ? 'danger' : 'success'} border-opacity-25">
              ${r.STATUS || ''}
            </span>
          </td>
          <td class="text-nowrap small">${r.DATECREATED || ''}</td>
          <td class="text-nowrap small">${r.STATUSDATE || ''}</td>
          <td class="small">${r.ERRORCODE || ''}</td>
          <td class="small text-muted">${r.SUBERRORCODE || ''}</td>
        </tr>
      `).join('');
    }

    html = `
      <div class="table-responsive kpi-modal-table-wrap mt-1">
        <table class="table table-sm table-hover align-middle mb-0 kpi-modal-table">
          <thead class="table-light">
            ${theadHtml}
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>
      </div>
      <div class="d-flex justify-content-between align-items-center mt-2 small">
        <div>
          Menampilkan ${start + 1}–${Math.min(end, total)} dari ${total} data
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item ${modalPage === 1 ? 'disabled' : ''}">
              <button class="page-link" type="button" data-page="prev">&laquo;</button>
            </li>
            ${pageButtonsHtml}
            <li class="page-item ${modalPage === totalPages ? 'disabled' : ''}">
              <button class="page-link" type="button" data-page="next">&raquo;</button>
            </li>
          </ul>
        </nav>
      </div>`;
  }

  contentEl.innerHTML = html;

  // event pagination
  const pager = contentEl.querySelectorAll('.pagination .page-link');
  pager.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-page');
      if (p === 'prev' && modalPage > 1) modalPage--;
      else if (p === 'next' && modalPage < totalPages) modalPage++;
      else if (!isNaN(parseInt(p))) modalPage = parseInt(p);
      renderKendalaTablePage(typeKey);
    });
  });
}

function setKendalaMonthBadge() {
  const el = document.querySelector('.kpi-kendala-wrapper .pill-branch');
  if (!el) return;

  const now = new Date();
  const months = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ];

  const monthName = months[now.getMonth()];
  el.textContent = `Kendala bulan ${monthName}`;
}

function renderHsaProdukTable(headerRow, rows) {
  const thead = document.getElementById('kpiHsaProdukThead');
  const tbody = document.getElementById('kpiHsaProdukTbody');
  if (!thead || !tbody) return;

  // HEADER
  thead.innerHTML = '';
  const trHead = document.createElement('tr');
  headerRow.forEach((h, idx) => {
    const th = document.createElement('th');
    const span = document.createElement('span');
    span.textContent = h;
    span.style.display = 'block';
    span.style.whiteSpace = 'normal';
    span.style.lineHeight = '1.1';
    th.appendChild(span);

    th.style.fontSize = '0.72rem';
    th.style.verticalAlign = 'middle';
    if (idx === 0) th.classList.add('text-start');
    else {
      th.classList.add('text-center');
      th.style.minWidth = '70px';
    }
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);

  // BODY
  tbody.innerHTML = '';
  rows.forEach(r => {
    const sto = String(r[0] || '');
    const hsa = r[1] || '';
    const isBranch = sto.toUpperCase().includes('BRANCH');

    const tr = document.createElement('tr');
    if (isBranch) tr.classList.add('kpi-kendala-row-branch'); // reuse style abu

    r.forEach((val, idx) => {
      const td = document.createElement('td');
      const value = val || '';

      if (idx === 0) {
        td.textContent = value;
        td.classList.add('kpi-sto-name');
      } else if (idx === 1) {
        td.textContent = value;
      } else {
        td.classList.add('text-center');

        // helper untuk tiga produk + WIFI, supaya tidak copas berulang
        const makeClickableProdukCell = (label, typeKey) => {
          const count = Number(value) || 0;
          td.textContent = count;

          if (count > 0 && !isBranch) {
            td.classList.add('kpi-kendala-clickable');
            td.style.cursor = 'pointer';
            td.addEventListener('click', async () => {
              if (td.classList.contains('loading')) return;

              td.classList.add('loading');
              const originalText = td.textContent;
              td.innerHTML = `
                <div class="kpi-modal-loading">
                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <span>${originalText}</span>
                </div>
              `;

              try {
                await openKendalaModal({
                  sto,
                  hsa,
                  label,
                  typeKey,
                  count
                });
              } finally {
                td.classList.remove('loading');
                td.textContent = originalText;
              }
            });
          }
        };

        if (idx === 2) {
          // INDIHOME
          makeClickableProdukCell('INDIHOME PS', 'INDIHOME_PS');
        } else if (idx === 3) {
          // INDIBIZ
          makeClickableProdukCell('INDIBIZ', 'INDIBIZ');
        } else if (idx === 4) {
          // DATIN
          makeClickableProdukCell('DATIN', 'DATIN');
        } else if (idx === 5) {
          // WIFI
          makeClickableProdukCell('WIFI', 'WIFI');
        } else {
          // produk lain: render biasa
          td.textContent = value;
        }
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}
