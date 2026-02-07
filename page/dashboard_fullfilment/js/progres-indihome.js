let API_URL = "";
let refreshTimer = null;

/* ================= INIT ================= */
function initProgresIndihome(apiUrl) {
  API_URL = apiUrl;
  loadIndihomeData();

  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(loadIndihomeData, 60000); // auto refresh 1 menit
}

/* ================= LOAD DATA ================= */
async function loadIndihomeData() {
  try {
    showLoading(true);

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("API Error");

    const data = await res.json();
    window.lastData = data;

    updateHeader(data);
    updateBoxes(data);
    updateClusterTable(data);
    updateManjaTable(data);
    updateKendalaNonTeknik(data);

    showLoading(false);

    // render semua garis setelah data update
    renderLines();

  } catch (err) {
    console.error("Fetch error:", err);
    showError("Gagal load data dari server");
  }
}

/* ================= UI STATE ================= */
function showLoading(show) {
  const area = document.getElementById("content-area");
  if (!area) return;
  area.classList.toggle("loading", show);
}

function showError(msg) {
  const area = document.getElementById("content-area");
  area.innerHTML = `
    <div class="alert alert-danger text-center">
      <b>Error:</b> ${msg}
    </div>
  `;
}

/* ================= HEADER ================= */
function updateHeader(data) {
  const time = new Date(data.updateTime);
  const el = document.getElementById("updateTime");
  if (el) el.innerText = "Last Update : " + time.toLocaleString("id-ID");
}

/* ================= BOX ================= */
function updateBoxes(data) {
  const wo = data.woTotal || 0;
  const sisa = data.sisa || 0;
  const sudah = data.sudah || 0;
  const manja = data.manja || 0;
  const nonManja = data.nonManja || 0;
  const sukses = data.sukses || 0;
  const gagal = data.gagal || 0;

  setBox("wo", wo);
  setBoxPercent("sisa", sisa, wo);
  setBoxPercent("sudah", sudah, wo);
  setBoxPercent("manja", manja, wo);
  setBoxPercent("manja2", nonManja, wo);
  setBoxPercent("sukses", sukses, wo);
  setBoxPercent("gagal", gagal, wo);
}

function setBox(id, value) {
  const box = document.getElementById(id);
  if (!box) return;
  const b = box.querySelector("b");
  if (b) b.innerText = value;
}

function setBoxPercent(id, value, total) {
  const box = document.getElementById(id);
  if (!box) return;
  const b = box.querySelector("b");
  const small = box.querySelector("small");
  const percent = total ? ((value / total) * 100).toFixed(2) : 0;
  if (b) b.innerText = value;
  if (small) small.innerText = percent + "%";
}

/* ================= TABLE CLUSTER ================= */
function updateClusterTable(data) {
  const table = document.querySelector("#tblSisa table");
  if (!table) return;

  let html = `<tr><th>CLUSTER</th><th>WO</th></tr>`;
  let grandTotal = 0;

  for (let cluster in data.cluster) {
    const val = data.cluster[cluster] || 0;
    grandTotal += val;
    html += `<tr><td>${cluster}</td><td>${val}</td></tr>`;
  }

  html += `<tr><th>GRAND TOTAL</th><th>${grandTotal}</th></tr>`;
  table.innerHTML = html;
}

/* ================= TABLE MANJA ================= */
function updateManjaTable(data) {
  const table = document.querySelector("#tblManja table");
  if (!table) return;

  let html = `<tr>
    <th>CLUSTER</th>
    <th>MANJA</th>
    <th>NON MANJA</th>
    <th>TOTAL</th>
  </tr>`;

  let totalManja = 0;
  let totalNonManja = 0;

  for (let cluster in data.cluster) {
    const manja = data.manja || 0;
    const nonManja = data.nonManja || 0;
    const total = manja + nonManja;

    html += `
      <tr>
        <td>${cluster}</td>
        <td>${manja}</td>
        <td>${nonManja}</td>
        <td>${total}</td>
      </tr>
    `;
    totalManja += manja;
    totalNonManja += nonManja;
  }

  html += `
    <tr>
      <th>GRAND TOTAL</th>
      <th>${totalManja}</th>
      <th>${totalNonManja}</th>
      <th>${totalManja + totalNonManja}</th>
    </tr>
  `;

  table.innerHTML = html;
}

/* ================= POSISI DAN GARIS ================= */
function positionTablesBelowCards() {
  const parent = document.querySelector(".tree-area");
  const parentRect = parent.getBoundingClientRect();

  const tblSisa = document.getElementById("tblSisa");
  const tblManja = document.getElementById("tblManja");
  const tblNonTeknik = document.getElementById("tblNonTeknik");
  const tblTeknik = document.getElementById("tblTeknik");

  const cardSisa = document.getElementById("sisa");
  const cardManja = document.getElementById("manja");
  const cardGagal = document.getElementById("gagal");

  if (!tblSisa || !tblManja || !tblNonTeknik || !cardSisa || !cardManja || !cardGagal) return;

  /* ==== TABEL SISA (kiri) ==== */
  const rectSisa = cardSisa.getBoundingClientRect();
  tblSisa.style.position = "absolute";
  tblSisa.style.top = (rectSisa.bottom - parentRect.top + 15) + "px";
  tblSisa.style.left = "20px";

  /* ==== TABEL MANJA (kanan tblSisa) ==== */
  const rectManja = cardManja.getBoundingClientRect();
  tblManja.style.position = "absolute";
  tblManja.style.top = (rectManja.bottom - parentRect.top + 15) + "px";
  tblManja.style.left = (tblSisa.offsetLeft + tblSisa.offsetWidth + 20) + "px";

  /* ==== TABEL NON TEKNIK (kanan card GAGAL) ==== */
  const rectGagal = cardGagal.getBoundingClientRect();
  tblNonTeknik.style.position = "absolute";
  tblNonTeknik.style.top = (rectGagal.bottom - parentRect.top + 15) + "px";
  tblNonTeknik.style.left = (rectGagal.right - parentRect.left + 20) + "px";

  /* ==== TABEL TEKNIS (di bawah NON TEKNIK) ==== */
  if (tblTeknik) {
    const bottomNonTeknik = tblNonTeknik.offsetTop + tblNonTeknik.offsetHeight;
    tblTeknik.style.position = "absolute";
    tblTeknik.style.top = (bottomNonTeknik + 15) + "px";
    tblTeknik.style.left = tblNonTeknik.style.left;
  }
}

/* ================= KENDALA NON TEKNIK ================= */
function updateKendalaNonTeknik(data) {
  const table = document.querySelector("#tblNonTeknik table");
  if (!table) return;

  let html = `<tr>
    <th>KENDALA</th>
    <th>KOTANG</th>
    <th>TANGSEL</th>
    <th>TOTAL</th>
  </tr>`;

  let gKotang = 0, gTangsel = 0, gTotal = 0;

  for (let k in data.kendalaNonTeknis) {
    const row = data.kendalaNonTeknis[k];
    const kotang = row.KOTANG || 0;
    const tangsel = row.TANGSEL || 0;
    const total = row.total || 0;
    html += `<tr><td>${k}</td><td>${kotang}</td><td>${tangsel}</td><td>${total}</td></tr>`;
    gKotang += kotang;
    gTangsel += tangsel;
    gTotal += total;
  }

  html += `<tr><th>GRAND TOTAL</th><th>${gKotang}</th><th>${gTangsel}</th><th>${gTotal}</th></tr>`;
  table.innerHTML = html;

  updateKendalaTeknisPosition();
}

/* ================= KENDALA TEKNIS ================= */
function updateKendalaTeknisPosition() {
  const nonTeknik = document.getElementById("tblNonTeknik");
  const teknik = document.getElementById("tblTeknik");
  if (!nonTeknik || !teknik) return;

  const dataTeknis = window.lastData?.kendalaTeknis || {};
  const table = teknik.querySelector("table");
  if (!table) return;

  let html = `<tr>
    <th>KENDALA</th>
    <th>KOTANG</th>
    <th>TANGSEL</th>
    <th>TOTAL</th>
  </tr>`;

  let gKotang = 0, gTangsel = 0, gTotal = 0;

  for (let k in dataTeknis) {
    const row = dataTeknis[k];
    const kotang = row.KOTANG || 0;
    const tangsel = row.TANGSEL || 0;
    const total = row.total || 0;
    html += `<tr><td>${k}</td><td>${kotang}</td><td>${tangsel}</td><td>${total}</td></tr>`;
    gKotang += kotang;
    gTangsel += tangsel;
    gTotal += total;
  }

  html += `<tr><th>GRAND TOTAL</th><th>${gKotang}</th><th>${gTangsel}</th><th>${gTotal}</th></tr>`;
  table.innerHTML = html;

  const bottomNonTeknik = nonTeknik.offsetTop + nonTeknik.offsetHeight;
  teknik.style.top = bottomNonTeknik + 10 + "px";

  drawTableLines();
}

/* ================= GARIS ANTAR BOX ================= */
function drawPath(fromId, toId) {
  const from = document.getElementById(fromId);
  const to = document.getElementById(toId);
  const svg = document.getElementById("tree-lines");
  if (!from || !to || !svg) return;

  const parent = document.querySelector(".tree-area").getBoundingClientRect();
  const f = from.getBoundingClientRect();
  const t = to.getBoundingClientRect();

  const x1 = f.right - parent.left;
  const y1 = f.top + f.height / 2 - parent.top;
  const x2 = t.left - parent.left;
  const y2 = t.top + t.height / 2 - parent.top;
  const midX = x1 + 40;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#333");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");

  svg.appendChild(path);
}

function drawTreeLines() {
  const svg = document.getElementById("tree-lines");
  if (!svg) return;
  svg.innerHTML = "";

  drawPath("wo", "sisa");
  drawPath("wo", "sudah");
  drawPath("sisa", "manja");
  drawPath("sisa", "manja2");
  drawPath("sudah", "sukses");
  drawPath("sudah", "gagal");
}

/* ================= GARIS CARD → TABLE ================= */
function drawTableLines() {
  const svg = document.getElementById("tree-lines");
  if (!svg) return;

  // hapus dulu garis card->table lama
  svg.querySelectorAll(".card-table-line").forEach(line => line.remove());

  function drawLine(cardId, tableId) {
    const card = document.getElementById(cardId);
    const table = document.getElementById(tableId);
    if (!card || !table) return;

    const parent = document.querySelector(".tree-area").getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();

    // titik awal: tengah bawah card
    const x1 = cardRect.left + cardRect.width / 2 - parent.left;
    const y1 = cardRect.bottom - parent.top;

    // titik akhir: tengah atas table
    const x2 = tableRect.left + tableRect.width / 2 - parent.left;
    const y2 = tableRect.top - parent.top;

    let d = "";

    // ✅ KHUSUS card gagal → tabel kendala (turun dulu)
    if (cardId === "gagal") {
      const midY = y1 + 40; // turun dulu 40px

      d = `
        M ${x1} ${y1}
        L ${x1} ${midY}
        L ${x2} ${midY}
        L ${x2} ${y2}
      `;
    } 
    // ✅ selain gagal tetap pakai pola lama (horizontal dulu)
    else {
      const midX = x1 + (x2 > x1 ? 40 : -40);

      d = `
        M ${x1} ${y1}
        L ${midX} ${y1}
        L ${midX} ${y2}
        L ${x2} ${y2}
      `;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#333");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.classList.add("card-table-line");

    svg.appendChild(path);
  }

  drawLine("sisa", "tblSisa");       // normal
  drawLine("manja", "tblManja");     // normal
  drawLine("gagal", "tblNonTeknik"); // khusus turun dari bawah
}


/* ================= RENDER SEMUA GARIS ================= */
function renderLines() {
  positionTablesBelowCards();
  drawTreeLines();
  drawTableLines();
}

// resize listener
window.addEventListener("resize", renderLines);
