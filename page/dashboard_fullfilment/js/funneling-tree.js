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

    console.log("DATA FUNNEL:", data); // cek di console

    renderFunnel(data);

  } catch (e) {
    console.log("ERROR LOAD FUNNEL", e);
  }

  hideLoading();
}

function renderFunnel(data) {
  // safety log
  if (!data) {
    console.warn("DATA KOSONG");
    return;
  }

  const c = data.cards || {};

  console.log("CARDS:", c);

  // mapping cards → angka000–008 (sesuai JSON contoh yang kamu kirim)
  update("angka000", c["WO PSB"]?.nilai ?? 0);
  update("angka001", c["SUDAH PROGRES"]?.nilai ?? 0);
  update("angka002", c["SISA PROGRES"]?.nilai ?? 0);
  update("angka003", c["MANJA HI EXP"]?.nilai ?? 0);
  update("angka004", c["MANJA H+ & NON MANJA"]?.nilai ?? 0);
  update("angka005", c["SUKSES"]?.nilai ?? 0);
  update("angka006", c["GAGALTARIK"]?.nilai ?? 0);
  update("angka007", c["PS END STATE"]?.nilai ?? 0);
  update("angka008", c["OGP TARIK PS END STATE"]?.nilai ?? 0);

  // sementara angka009–011 belum ada di JSON contoh
  // update("angka009", ...);
  // update("angka010", ...);
  // update("angka011", ...);

  // --- HITUNG KENDALA ---

  const kendalaPelangganTable = data.kendalaPelangganTable || [];
  const kendalaTeknisTable = data.kendalaTeknisTable || [];
  const kendalaSistemTable = data.kendalaSistemTable || [];   // kalau belum ada, akan kosong
  const kendalaLainnyaTable = data.kendalaLainnyaTable || []; // kalau belum ada, akan kosong

  const kdlPlgn = kendalaPelangganTable.reduce(
    (sum, row) => sum + (row.total || 0),
    0
  );

  const kdlTeknik = kendalaTeknisTable.reduce(
    (sum, row) => sum + (row.total || 0),
    0
  );

  const kdlSistem = kendalaSistemTable.reduce(
    (sum, row) => sum + (row.total || 0),
    0
  );

  const kdlLainnya = kendalaLainnyaTable.reduce(
    (sum, row) => sum + (row.total || 0),
    0
  );

  console.log("KDL PLGN:", kdlPlgn, "KDL TEKNIK:", kdlTeknik, "KDL SISTEM:", kdlSistem, "KDL LAINNYA:", kdlLainnya);

  update("angka012", kdlPlgn);
  update("angka013", kdlTeknik);
  update("angka014", kdlSistem);
  update("angka015", kdlLainnya);
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

  // hindari NaN
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
