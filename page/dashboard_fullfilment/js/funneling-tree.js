let API_URL = "";
let filtersInitialized = false;
let lastParams = null;
let lastData = null;

// detail + pagination + search
let detailRows = [];
let detailFilteredRows = [];
let detailPageSize = 10;
let detailCurrentPage = 1;

// ========================
// INIT
// ========================
function initFunnelingTree(api) {
  API_URL = api;

  const btn = document.getElementById("btnFilter");
  if (btn) {
    btn.addEventListener("click", loadData);
  }

  attachFunnelClickHandlers();  // pasang klik di angka

  loadData(); // load summary pertama kali
}

// ========================
// LOADING UI
// ========================
function showLoading() {
  const box = document.getElementById("loadingBox");
  if (box) box.style.display = "block";

  const ls = document.getElementById("loadingSvg");
  if (ls) ls.style.display = "flex";
}

function hideLoading() {
  const box = document.getElementById("loadingBox");
  if (box) box.style.display = "none";

  const ls = document.getElementById("loadingSvg");
  if (ls) ls.style.display = "none";
}

// ========================
// LOAD SUMMARY (TREE)
// ========================
async function loadData() {
  showLoading();

  const hsaEl = document.getElementById("filterHSA");
  const stoEl = document.getElementById("filterSTO");
  const startEl = document.getElementById("startDate");
  const endEl = document.getElementById("endDate");

  const hsa = hsaEl ? hsaEl.value : "";
  const sto = stoEl ? stoEl.value : "";
  const start = startEl ? startEl.value : "";
  const end = endEl ? endEl.value : "";

  const params = { hsa, sto, start, end };

  // cache kalau param sama
  if (
    lastParams &&
    JSON.stringify(lastParams) === JSON.stringify(params) &&
    lastData
  ) {
    console.log("PAKAI CACHE FUNNEL");
    renderFunnel(lastData);
    hideLoading();
    return;
  }

  const url =
    API_URL
    + "?action=getfunnelingtree"
    + "&hsa=" + encodeURIComponent(hsa)
    + "&sto=" + encodeURIComponent(sto)
    + "&start=" + encodeURIComponent(start)
    + "&end=" + encodeURIComponent(end);

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log("DATA FUNNEL:", data);

    lastParams = params;
    lastData = data;

    fillFiltersOnce(data);
    renderFunnel(data);

  } catch (e) {
    console.log("ERROR LOAD FUNNEL", e);
  }

  hideLoading();
}

// ========================
// FILTER DROPDOWN
// ========================
function fillFiltersOnce(data) {
  if (filtersInitialized) return;
  filtersInitialized = true;

  const hsaSelect = document.getElementById("filterHSA");
  const stoSelect = document.getElementById("filterSTO");

  if (data.hsaList && hsaSelect) {
    data.hsaList.forEach(h => {
      const opt = document.createElement("option");
      opt.value = h;
      opt.textContent = h;
      hsaSelect.appendChild(opt);
    });
  }

  if (data.stoList && stoSelect) {
    data.stoList.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      stoSelect.appendChild(opt);
    });
  }
}

// ========================
// RENDER SUMMARY (ANGKA)
// ========================
function renderFunnel(data) {
  if (!data) return;

  const c = data.cards || {};
  console.log("CARDS:", c);

  update("angka000", c.INPUT_ORDER ?? 0);   // INPUT ORDER
  update("angka001", c.PI ?? 0);           // PI
  update("angka002", c.WAPPR ?? 0);        // WAPPR
  update("angka003", c.STARTWORK ?? 0);    // STARTWORK
  update("angka004", c.INPROGRESS ?? 0);   // INPROGRESS
  update("angka005", c.COMPWORK ?? 0);     // COMPWORK
  update("angka006", c.CANCEL ?? 0);       // CANCEL
  update("angka007", c.WORKFAIL ?? 0);     // WORKFAIL
  update("angka008", c.PENDWORK ?? 0);     // PENDWORK
  update("angka009", c.CONTWORK ?? 0);     // CONTWORK
  update("angka010", c.INSTCOMP ?? 0);     // INSTCOMP

  // PROGRESS to PS
  update("angka011", c.PROGRESS_PS ?? c.PROGRESS_TO_PS ?? 0);

  update("angka012", c.KDL_PLGN ?? 0);     // KDL PLGN
  update("angka013", c.KDL_TEKNIK ?? 0);   // KDL TEKNIK
  update("angka014", c.KDL_SISTEM ?? 0);   // KDL SISTEM
  update("angka015", c.KDL_LAINNYA ?? 0);  // KDL LAINNYA
}

function update(id, val) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn("ELEMEN TIDAK KETEMU:", id);
    return;
  }

  const num = parseInt(val || 0, 10);
  animateNumber(el, num);
}

// animasi angka ringan
function animateNumber(el, target) {
  target = Number(target || 0);

  if (!Number.isFinite(target) || target === 0) {
    el.textContent = "0";
    return;
  }

  const steps = 10;
  const step = target / steps;
  let current = 0;
  let count = 0;

  const timer = setInterval(() => {
    count++;
    current += step;

    if (count >= steps) {
      el.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current);
    }
  }, 30);
}

// ============================
// DETAIL: KLIK ANGKA -> MODAL
// ============================
const stageMap = {
  angka000: 'INPUT_ORDER',
  angka001: 'PI',
  angka002: 'WAPPR',
  angka003: 'STARTWORK',
  angka004: 'INPROGRESS',
  angka005: 'COMPWORK',
  angka006: 'CANCEL',
  angka007: 'WORKFAIL',
  angka008: 'PENDWORK',
  angka009: 'CONTWORK',
  angka010: 'INSTCOMP',
  angka011: 'PROGRESS_PS',
  angka012: 'KDL_PLGN',
  angka013: 'KDL_TEKNIK',
  angka014: 'KDL_SISTEM',
  angka015: 'KDL_LAINNYA'
};

function attachFunnelClickHandlers() {
  console.log("INIT HANDLER FUNNEL");

  Object.keys(stageMap).forEach(id => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn("ELEMEN ANGKA TIDAK KETEMU:", id);
      return;
    }

    el.style.cursor = 'pointer';

    el.addEventListener('click', () => {
      const stage = stageMap[id];
      const val = parseInt((el.textContent || "0").replace(/\./g, ''), 10) || 0;
      console.log("KLIK ANGKA", id, "stage:", stage, "val:", val);

      if (val === 0) return; // kalau 0, tidak usah load detail

      showLoading();
      loadFunnelDetail(stage)
        .catch(err => {
          console.error("ERROR LOAD DETAIL FUNNEL", err);
          alert("Gagal load detail funnel");
        })
        .finally(hideLoading);
    });
  });
}

async function loadFunnelDetail(stage) {
  const hsaEl = document.getElementById("filterHSA");
  const stoEl = document.getElementById("filterSTO");
  const startEl = document.getElementById("startDate");
  const endEl = document.getElementById("endDate");

  const hsa = hsaEl ? hsaEl.value : "";
  const sto = stoEl ? stoEl.value : "";
  const start = startEl ? startEl.value : "";
  const end = endEl ? endEl.value : "";

  const params = new URLSearchParams({
    action: 'getfunnelingdetail',
    stage: stage,
    hsa: hsa,
    sto: sto,
    start: start,
    end: end
  });

  const url = `${API_URL}?${params.toString()}`;

  const res = await fetch(url);
  const json = await res.json();
  console.log("DETAIL FUNNEL:", json);

  renderDetailTable(stage, json.rows || []);
}

// ============================
// DETAIL: RENDER + PAGINATION + SEARCH
// ============================
function renderDetailTable(stage, rows) {
  // simpan ke global
  detailRows = rows || [];
  detailFilteredRows = detailRows.slice(); // awalnya tanpa filter
  detailCurrentPage = 1;

  const titleEl = document.getElementById('detailTitle');
  if (titleEl) {
    titleEl.textContent = `Detail ${stage} (${detailRows.length} row)`;
  }

  // reset input search
  const searchEl = document.getElementById('detailSearchWONUM');
  if (searchEl) {
    searchEl.value = '';
    searchEl.oninput = handleDetailSearch;
  }

  renderDetailPage();
  renderDetailPagination();

  const modalEl = document.getElementById('detailModal');
  if (modalEl && window.bootstrap) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

function handleDetailSearch() {
  const searchEl = document.getElementById('detailSearchWONUM');
  const keyword = (searchEl?.value || '').trim().toUpperCase();

  if (!keyword) {
    detailFilteredRows = detailRows.slice();
  } else {
    detailFilteredRows = detailRows.filter(r => {
      const wonum = String(r.WONUM || '').toUpperCase();
      return wonum.includes(keyword);
    });
  }

  detailCurrentPage = 1;
  renderDetailPage();
  renderDetailPagination();
}

function renderDetailPage() {
  const tbody = document.querySelector('#detailTable tbody');
  if (!tbody) {
    console.warn("detailTable tbody tidak ditemukan");
    return;
  }

  tbody.innerHTML = '';

  if (!detailFilteredRows || detailFilteredRows.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="11" class="text-center text-muted">Tidak ada data</td>`;
    tbody.appendChild(tr);
    const info = document.getElementById('detailInfo');
    if (info) info.textContent = '0 row';
    return;
  }

  const startIndex = (detailCurrentPage - 1) * detailPageSize;
  const endIndex = Math.min(startIndex + detailPageSize, detailFilteredRows.length);
  const pageRows = detailFilteredRows.slice(startIndex, endIndex);

  pageRows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.WONUM || ''}</td>
      <td>${r.STO || ''}</td>
      <td>${r.SERVICENUM || ''}</td>
      <td>${r.CHIEF_CODE || ''}</td>
      <td>${r.CHIEF_NAME || ''}</td>
      <td>${r.STATUS || ''}</td>
      <td>${r.ERRORCODE || ''}</td>
      <td>${r.SUBERRORCODE || ''}</td>
      <td>${r.ENGINEERMEMO || ''}</td>
      <td>${r.TGL || ''}</td>
      <td>${r.HSA || ''}</td>
    `;
    tbody.appendChild(tr);
  });

  const info = document.getElementById('detailInfo');
  if (info) {
    info.textContent = `Menampilkan ${startIndex + 1}–${endIndex} dari ${detailFilteredRows.length} row`;
  }
}

function renderDetailPagination() {
  const pagEl = document.getElementById('detailPagination');
  if (!pagEl) return;

  pagEl.innerHTML = '';

  if (!detailFilteredRows || detailFilteredRows.length === 0) return;

  const totalPages = Math.ceil(detailFilteredRows.length / detailPageSize);
  if (totalPages <= 1) return;

  const createPageItem = (label, page, disabled = false, active = false) => {
    const li = document.createElement('li');
    li.className = 'page-item';
    if (disabled) li.classList.add('disabled');
    if (active) li.classList.add('active');

    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (disabled || page === detailCurrentPage) return;
      detailCurrentPage = page;
      renderDetailPage();
      renderDetailPagination();
    });

    li.appendChild(a);
    return li;
  };

  // Prev
  pagEl.appendChild(
    createPageItem('«', Math.max(1, detailCurrentPage - 1), detailCurrentPage === 1)
  );

  // nomor halaman
  for (let p = 1; p <= totalPages; p++) {
    pagEl.appendChild(
      createPageItem(String(p), p, false, p === detailCurrentPage)
    );
  }

  // Next
  pagEl.appendChild(
    createPageItem('»', Math.min(totalPages, detailCurrentPage + 1), detailCurrentPage === totalPages)
  );
}
