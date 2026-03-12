let API_URL = "";
let filtersInitialized = false;
let lastParams = null;
let lastData = null;

function initFunnelingTree(api) {
  API_URL = api;

  const btn = document.getElementById("btnFilter");
  if (btn) {
    btn.addEventListener("click", loadData);
  }

  // load pertama kali, sekali saja
  loadData();
}

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

  // kalau param sama persis dan sudah punya data, pakai cache
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

  // sesuaikan kalau backend punya field khusus progress ke PS
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

// versi animasi ringan
function animateNumber(el, target) {
  target = Number(target || 0);

  if (!Number.isFinite(target) || target === 0) {
    el.textContent = "0";
    return;
  }

  const steps = 10; // lebih kecil = lebih ringan
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
