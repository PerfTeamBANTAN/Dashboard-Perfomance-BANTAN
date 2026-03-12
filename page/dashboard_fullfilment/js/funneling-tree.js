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

  // mapping sesuai key yang muncul di log kamu
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

  // kalau API punya key khusus untuk progress ke PS, pakai di sini
  // misal: PROGRESS_PS atau PROGRESS_TO_PS
  update("angka011", c.PROGRESS_PS ?? c.PROGRESS_TO_PS ?? 0);

  // kendala langsung dari cards (sudah kelihatan di log kamu)
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

function animateNumber(el, target) {
  let start = 0;

  if (!Number.isFinite(target)) {
    el.innerText = "0";
    return;
  }

  if (target === 0) {
    el.innerText = "0";
    return;
  }

  const step = target / 20;

  const timer = setInterval(() => {
    start += step;

    if (start >= target) {
      el.innerText = target.toLocaleString();
      clearInterval(timer);
    } else {
      el.innerText = Math.floor(start);
    }
  }, 20);
}
