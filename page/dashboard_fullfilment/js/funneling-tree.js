let API_URL = "";

function initFunnelingTree(api) {
  API_URL = api;

  loadFilterOptions();

  document
    .getElementById("btnFilter")
    .addEventListener("click", loadData);

  loadData();

  setInterval(loadData, 30000);
}

function showLoading() {
  document.getElementById("loadingBox").style.display = "block";
}

function hideLoading() {
  document.getElementById("loadingBox").style.display = "none";
}

async function loadFilterOptions() {
  try {
    const res = await fetch(API_URL + "?action=getfunnelingtree");
    const data = await res.json();

    const hsaSelect = document.getElementById("filterHSA");
    const stoSelect = document.getElementById("filterSTO");

    if (data.hsaList) {
      data.hsaList.forEach(h => {
        const opt = document.createElement("option");
        opt.value = h;
        opt.textContent = h;
        hsaSelect.appendChild(opt);
      });
    }

    if (data.stoList) {
      data.stoList.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        stoSelect.appendChild(opt);
      });
    }

  } catch (e) {
    console.log("ERROR LOAD FILTER", e);
  }
}

async function loadData() {
  showLoading();

  const hsa = document.getElementById("filterHSA").value;
  const sto = document.getElementById("filterSTO").value;
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

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

    renderFunnel(data);

  } catch (e) {
    console.log("ERROR LOAD FUNNEL", e);
  }

  hideLoading();
}

function renderFunnel(data) {
  if (!data) return;

  const c = data.cards || {};
  console.log("CARDS:", c);

  update("angka000", c.INPUT_ORDER ?? 0);
  update("angka001", c.PI ?? 0);
  update("angka002", c.WAPPR ?? 0);
  update("angka003", c.STARTWORK ?? 0);
  update("angka004", c.INPROGRESS ?? 0);
  update("angka005", c.COMPWORK ?? 0);
  update("angka006", c.CANCEL ?? 0);
  update("angka007", c.WORKFAIL ?? 0);
  update("angka008", c.PENDWORK ?? 0);
  update("angka009", c.CONTWORK ?? 0);
  update("angka010", c.INSTCOMP ?? 0);
  update("angka011", c.PROGRESS_PS ?? c.PROGRESS_TO_PS ?? 0);

  update("angka012", c.KDL_PLGN ?? 0);
  update("angka013", c.KDL_TEKNIK ?? 0);
  update("angka014", c.KDL_SISTEM ?? 0);
  update("angka015", c.KDL_LAINNYA ?? 0);
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

function animateNumber(el, target) {
  let start = 0;

  if (!Number.isFinite(target)) {
    el.textContent = "0";
    return;
  }

  if (target === 0) {
    el.textContent = "0";
    return;
  }

  const step = target / 20;

  const timer = setInterval(() => {
    start += step;

    if (start >= target) {
      el.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start);
    }
  }, 20);
}

