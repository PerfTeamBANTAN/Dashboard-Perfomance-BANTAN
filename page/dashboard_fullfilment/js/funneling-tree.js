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

    renderFunnel(data);

  } catch (e) {
    console.log("ERROR LOAD FUNNEL", e);
  }

  hideLoading();
}

function renderFunnel(data) {
  if (!data.cards) {
    console.warn("DATA CARDS TIDAK ADA");
    return;
  }

  const c = data.cards;

  // mapping utama dari cards
  update("angka000", c["WO PSB"]?.nilai || 0);
  update("angka001", c["SUDAH PROGRES"]?.nilai || 0);
  update("angka002", c["SISA PROGRES"]?.nilai || 0);
  update("angka003", c["MANJA HI EXP"]?.nilai || 0);
  update("angka004", c["MANJA H+ & NON MANJA"]?.nilai || 0);
  update("angka005", c["SUKSES"]?.nilai || 0);
  update("angka006", c["GAGALTARIK"]?.nilai || 0);
  update("angka007", c["PS END STATE"]?.nilai || 0);
  update("angka008", c["OGP TARIK PS END STATE"]?.nilai || 0);

  // kalau nanti angka009–011 mau dipakai, tinggal mapping di sini
  // update("angka009", ...);
  // update("angka010", ...);
  // update("angka011", ...);

  // --- HITUNG KENDALA DARI TABLE ---

  // total kendala pelanggan (jumlah kolom total)
  const kdlPlgn = (data.kendalaPelangganTable || []).reduce(
    (sum, row) => sum + (row.total || 0),
    0
  );

  // total kendala teknis (jumlah kolom total)
  const kdlTeknik = (data.kendalaTeknisTable || []).reduce(
    (sum, row) => sum + (row.total || 0),
    0
  );

  // kalau ada tabel lain untuk sistem & lainnya, sesuaikan nama properti
  const kdlSistem = (data.kendalaSistemTable || []).reduce(
    (sum, row) => sum + (row.total || 0),
    0
  );

  const kdlLainnya = (data.kendalaLainnyaTable || []).reduce(
    (sum, row) => sum + (row.total || 0),
    0
  );

  // mapping ke SVG text
  update("angka012", kdlPlgn);
  update("angka013", kdlTeknik);
  update("angka014", kdlSistem);
  update("angka015", kdlLainnya);
}

function update(id, val) {
  const el = document.getElementById(id);
  if (!el) return;

  animateNumber(el, parseInt(val || 0, 10));
}

function animateNumber(el, target) {
  let start = 0;
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
