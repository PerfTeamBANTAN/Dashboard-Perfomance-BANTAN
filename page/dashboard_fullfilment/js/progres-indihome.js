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

    updateHeader(data);
    updateBoxes(data);
    updateClusterTable(data);
    updateManjaTable(data);
    updateKendalaNonTeknik(data);

    showLoading(false);

  } catch (err) {
    console.error("Fetch error:", err);
    showError("Gagal load data dari server");
  }
}

/* ================= UI STATE ================= */
function showLoading(show) {
  const area = document.getElementById("content-area");
  if (!area) return;

  if (show) {
    area.classList.add("loading");
  } else {
    area.classList.remove("loading");
  }
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
  document.getElementById("updateTime").innerText =
    "Last Update : " + time.toLocaleString("id-ID");
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
  box.querySelector("b").innerText = value;
}

function setBoxPercent(id, value, total) {
  const box = document.getElementById(id);
  if (!box) return;

  const percent = total ? ((value / total) * 100).toFixed(2) : 0;
  box.querySelector("b").innerText = value;
  box.querySelector("small").innerText = percent + "%";
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

/* ================= KENDALA NON TEKNIK ================= */
function updateKendalaNonTeknik(data) {
  const table = document.querySelector("#tblNonTeknik table");
  if (!table) return;

  let html = `
    <tr>
      <th>KENDALA</th>
      <th>KOTANG</th>
      <th>TANGSEL</th>
      <th>TOTAL</th>
    </tr>
  `;

  let gKotang = 0;
  let gTangsel = 0;
  let gTotal = 0;

  for (let kendala in data.kendalaNonTeknis) {
    const row = data.kendalaNonTeknis[kendala];

    const kotang = row.KOTANG || 0;
    const tangsel = row.TANGSEL || 0;
    const total = row.total || 0;

    html += `
      <tr>
        <td>${kendala}</td>
        <td>${kotang}</td>
        <td>${tangsel}</td>
        <td>${total}</td>
      </tr>
    `;

    gKotang += kotang;
    gTangsel += tangsel;
    gTotal += total;
  }

  html += `
    <tr>
      <th>GRAND TOTAL</th>
      <th>${gKotang}</th>
      <th>${gTangsel}</th>
      <th>${gTotal}</th>
    </tr>
  `;

  table.innerHTML = html;
}
