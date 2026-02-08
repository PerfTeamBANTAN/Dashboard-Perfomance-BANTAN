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
    updateHSATableWithModal(data);
    updateKendalaNonTeknik(data);
    updateKesimpulan(data);

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

  const cards = data.cards || {};

  // ambil nilai dari sheet WEB
  const wo     = cards["WO PSB"]?.nilai || 0;
  const sisa   = cards["SISA PROGRES"]?.nilai || 0;
  const sudah  = cards["SUDAH PROGRES"]?.nilai || 0;
  const manja  = cards["MANJA HI EXP"]?.nilai || 0;
  const nonManja = cards["MANJA H+ & NON MANJA"]?.nilai || 0;
  const sukses = cards["SUKSES"]?.nilai || 0;
  const gagal  = cards["GAGALTARIK"]?.nilai || 0;
  const psEnd  = cards["PS END STATE"]?.nilai || 0;
  const ogpEnd = cards["OGP TARIK PS END STATE"]?.nilai || 0;

  
  const pWo     = cards["WO PSB"]?.persen || "0%";
  const pSisa   = cards["SISA PROGRES"]?.persen || "0%";
  const pSudah  = cards["SUDAH PROGRES"]?.persen || "0%";
  const pManja  = cards["MANJA HI EXP"]?.persen || "0%";
  const pNonManja = cards["MANJA H+ & NON MANJA"]?.persen || "0%";
  const pSukses = cards["SUKSES"]?.persen || "0%";
  const pGagal  = cards["GAGALTARIK"]?.persen || "0%";
  const pPsEnd  = cards["PS END STATE"]?.persen || "0%";
const pOgpEnd = cards["OGP TARIK PS END STATE"]?.persen || "0%";

  // isi card (nilai + persen langsung dari sheet)
  setBox("wo", wo);

  setBoxValuePercent("sisa", sisa, pSisa);
  setBoxValuePercent("sudah", sudah, pSudah);
  setBoxValuePercent("manja", manja, pManja);
  setBoxValuePercent("manja2", nonManja, pNonManja);
  setBoxValuePercent("sukses", sukses, pSukses);
  setBoxValuePercent("gagal", gagal, pGagal);
  setBoxValuePercent("psEnd", psEnd, pPsEnd);
  setBoxValuePercent("ogpEnd", ogpEnd, pOgpEnd);
}

function setBoxValuePercent(id, value, percentText) {
  const box = document.getElementById(id);
  if (!box) return;

  const b = box.querySelector("b");
  const small = box.querySelector("small");

  let percentFormatted = percentText;

  // jika percent berupa number (0.259887...) ubah ke 25.99%
  if (typeof percentText === "number") {
    percentFormatted = (percentText * 100).toFixed(2) + "%";
  }

  // jika string tapi tanpa %
  if (typeof percentText === "string" && !percentText.includes("%")) {
    const num = parseFloat(percentText);
    if (!isNaN(num)) {
      percentFormatted = (num * 100).toFixed(2) + "%";
    }
  }

  if (b) b.innerText = value;
  if (small) small.innerText = percentFormatted;
}

function setBox(id, value) {
  const box = document.getElementById(id);
  if (!box) return;
  const b = box.querySelector("b");
  if (b) b.innerText = value;
}

/* ================= TABLE CLUSTER ================= */
function updateClusterTable(data) {
  const table = document.querySelector("#tblSisa table");
  if (!table) return;

  const rows = data.clusterTable || [];

  let html = `<tr><th>CLUSTER</th><th>TOTAL</th></tr>`;

  rows.forEach(row => {
    const cluster = row.cluster;
    const total = row.total || 0;

    if (!cluster) return;

    html += `<tr><td>${cluster}</td><td>${total}</td></tr>`;
  });

  table.innerHTML = html;
}

/* ================= TABLE MANJA (DARI SHEET WEB A18:F21) ================= */
function updateManjaTable(data) {
  const table = document.querySelector("#tblManja table");
  if (!table) return;

  const rows = data.manjaTable || [];

  let html = `
    <tr>
      <th>CLUSTER</th>
      <th>MANJA HI</th>
      <th>MANJA H+</th>
      <th>EXP</th>
      <th>NON MANJA</th>
      <th>TOTAL</th>
    </tr>
  `;

  rows.forEach(row => {
    html += `
      <tr>
        <td>${row.cluster || ""}</td>
        <td>${row.manjaHI || 0}</td>
        <td>${row.manjaH || 0}</td>
        <td>${row.exp || 0}</td>
        <td>${row.nonManja || 0}</td>
        <td>${row.total || 0}</td>
      </tr>
    `;
  });

  table.innerHTML = html;
}
/* ================= TABLE HSA ================= */
function updateHSATable(data) {
  const tbody = document.querySelector("#tblHSA table tbody");
  if (!tbody) return;

  const rows = data.hsaTable || [];
  let html = "";

  rows.forEach(row => {
    const totalWO = row.totalWO !== undefined
      ? row.totalWO
      : (row.ps || 0) + (row.sisaWO || 0) + (row.kp || 0) + (row.kt || 0);

    html += `
      <tr>
        <td>${row.sto || ""}</td>
        <td>${row.hsa || ""}</td>
        <td class="clickable" data-type="ESTPSHI">${row.estPSHI || 0}</td>
        <td class="clickable" data-type="PS">${row.ps || 0}</td>
        <td>${totalWO}</td>
        <td class="clickable" data-type="SISA">${row.sisaWO || 0}</td>
        <td class="clickable" data-type="KP">${row.kp || 0}</td>
        <td class="clickable" data-type="KT">${row.kt || 0}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/* ================= POSISI TABLE ================= */
function positionTablesBelowCards() {
  const parent = document.querySelector(".tree-area");
  if (!parent) return;

  const parentRect = parent.getBoundingClientRect();

  const tblSisa = document.getElementById("tblSisa");
  const tblManja = document.getElementById("tblManja");
  const tblHSA = document.getElementById("tblHSA");
  const tblNonTeknik = document.getElementById("tblNonTeknik");
  const tblTeknik = document.getElementById("tblTeknik");
  const kesimpulanBox = document.getElementById("kesimpulanBox");
  
  const cardSisa = document.getElementById("sisa");
  const cardManja = document.getElementById("manja");
  const cardGagal = document.getElementById("gagal");

  if (!tblSisa || !tblManja || !tblHSA || !cardSisa || !cardManja) return;

  /* ==== TABEL SISA ==== */
  const rectSisa = cardSisa.getBoundingClientRect();
  tblSisa.style.position = "absolute";
  tblSisa.style.top = (rectSisa.bottom - parentRect.top + 25) + "px";
  tblSisa.style.left = "20px";

  /* ==== TABEL MANJA ==== */
  const rectManja = cardManja.getBoundingClientRect();
  tblManja.style.position = "absolute";
  tblManja.style.top = (rectManja.bottom - parentRect.top + 15) + "px";
  tblManja.style.left = (tblSisa.offsetLeft + tblSisa.offsetWidth + 20) + "px";

  /* ==== TABEL HSA (DI BAWAH MANJA & KE KIRI) ==== */
  const bottomManja = tblManja.offsetTop + tblManja.offsetHeight;

  tblHSA.style.position = "absolute";
  tblHSA.style.top = (bottomManja + 20) + "px";

  const sisaLeft = tblSisa.offsetLeft;
  tblHSA.style.left = sisaLeft + "px";

  /* ==== KENDALA ==== */
  if (!tblNonTeknik || !cardGagal) return;

  const rectGagal = cardGagal.getBoundingClientRect();
  tblNonTeknik.style.position = "absolute";
  tblNonTeknik.style.top = (rectGagal.bottom - parentRect.top + 170) + "px";
  tblNonTeknik.style.left =
    (rectGagal.left - parentRect.left +
     rectGagal.width / 2 -
     tblNonTeknik.offsetWidth / 2) + "px";

  if (!tblTeknik) return;

  const bottomNonTeknik = tblNonTeknik.offsetTop + tblNonTeknik.offsetHeight;
  tblTeknik.style.position = "absolute";
  tblTeknik.style.top = (bottomNonTeknik + 20) + "px";
  tblTeknik.style.left = tblNonTeknik.style.left;
}
/* ==== KESIMPULAN BOX (INI YANG BARU) ==== */
  if (!kesimpulanBox) return;

  const bottomTeknik = tblTeknik.offsetTop + tblTeknik.offsetHeight;

  kesimpulanBox.style.position = "absolute";
  kesimpulanBox.style.top = (bottomTeknik + 30) + "px";
  kesimpulanBox.style.left = "50%";
  kesimpulanBox.style.transform = "translateX(-50%)";
  kesimpulanBox.style.width = "90%";
}

/* ================= TABEL KENDALA ================= */
function updateKendalaNonTeknik(data) {
  const table = document.querySelector("#tblNonTeknik table");
  if (!table) return;

  const rows = data.kendalaPelangganTable || [];

  let html = `<tr>
    <th>KENDALA</th>
    <th>KOTANG</th>
    <th>TANGSEL</th>
    <th>TOTAL</th>
  </tr>`;

  rows.forEach(row => {
  html += `
    <tr>
      <td class="clickable" data-type="KP" data-detail="${row.kendala}" data-cluster="TOTAL">${row.kendala}</td>
      <td class="clickable" data-type="KP" data-detail="${row.kendala}" data-cluster="KOTANG">${row.kotang}</td>
      <td class="clickable" data-type="KP" data-detail="${row.kendala}" data-cluster="TANGSEL">${row.tangsel}</td>
      <td class="clickable" data-type="KP" data-detail="${row.kendala}" data-cluster="TOTAL">${row.total}</td>
    </tr>
  `;
});


  table.innerHTML = html;

  bindKendalaClicks();
  updateKendalaTeknisTable(data);
}

function updateKendalaTeknisTable(data) {
  const teknik = document.getElementById("tblTeknik");
  if (!teknik) return;

  const table = teknik.querySelector("table");
  if (!table) return;

  const rows = data.kendalaTeknisTable || [];

  let html = `<tr>
    <th>KENDALA</th>
    <th>KOTANG</th>
    <th>TANGSEL</th>
    <th>TOTAL</th>
  </tr>`;

  rows.forEach(row => {
  const kendala = row.kendala || "";

  html += `
    <tr>
      <td>${kendala}</td>
      <td class="clickable" data-type="KT" data-detail="${kendala}" data-cluster="KOTANG">${row.kotang || 0}</td>
      <td class="clickable" data-type="KT" data-detail="${kendala}" data-cluster="TANGSEL">${row.tangsel || 0}</td>
      <td class="clickable" data-type="KT" data-detail="${kendala}" data-cluster="TOTAL">${row.total || 0}</td>
    </tr>
  `;
});

  table.innerHTML = html;

  bindKendalaClicks();
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

  // hapus dulu garis lama card->table
  svg.querySelectorAll(".card-table-line").forEach(line => line.remove());

  function drawLine(cardId, tableId) {
  const card = document.getElementById(cardId);
  const table = document.getElementById(tableId);
  if (!card || !table) return;

  const parent = document.querySelector(".tree-area").getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();

  let x1, y1, x2, y2, d;

  // ================= KHUSUS GAGAL → KENDALA (GARIS LURUS) =================
  if (cardId === "gagal") {

    // titik awal: tengah bawah card gagal
    x1 = cardRect.left + cardRect.width / 2 - parent.left;
    y1 = cardRect.bottom - parent.top;

    // titik akhir: tengah atas tabel kendala
    x2 = tableRect.left + tableRect.width / 2 - parent.left;
    y2 = tableRect.top - parent.top;

    // garis lurus
    d = `
      M ${x1} ${y1}
      L ${x2} ${y2}
    `;
  }
  // ================= GARIS CARD LAIN (BELAKU SEPERTI BIASA) =================
  else {

    // titik awal: sisi kiri tengah card
    x1 = cardRect.left - parent.left;
    y1 = cardRect.top + cardRect.height / 2 - parent.top;

    // titik akhir: sisi kiri tengah tabel
    x2 = tableRect.left - parent.left;
    y2 = tableRect.top + tableRect.height / 2 - parent.top;

    const midX = x1 - 40;

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

  document.getElementById("tree-lines").appendChild(path);
}

  // normal (samping)
  drawLine("sisa", "tblSisa");
  drawLine("manja", "tblManja");

  // khusus dari bawah
  drawLine("gagal", "tblNonTeknik");
}

/* ================= RENDER SEMUA GARIS ================= */
function renderLines() {
  positionTablesBelowCards();
  drawTreeLines();
  drawTableLines();
}

// resize listener
window.addEventListener("resize", renderLines);

/* ================= MODAL DETAIL ================= */

function openModal() {
  const modal = document.getElementById("modalDetail");
  if (!modal) return;
  modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("modalDetail");
  if (!modal) return;
  modal.style.display = "none";
}

// klik luar modal untuk tutup
window.addEventListener("click", function (e) {
  const modal = document.getElementById("modalDetail");
  if (!modal) return;
  if (e.target === modal) modal.style.display = "none";
});


/* ================= SHOW MODAL BASED ON HITUNGAN ================= */
async function showHSADetail(sto, type) {
  const modal = document.getElementById("modalDetail");
  const tbody = modal.querySelector("#modalTable tbody");
  if (!modal || !tbody) return;

  // sekarang colspan = 8 (karena ada kolom NO)
  tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;
  openModal();

  try {
    const url = `${API_URL}?action=getwohi&sto=${encodeURIComponent(sto)}&type=${encodeURIComponent(type)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">Tidak ada data ${type} untuk STO ${sto}</td>
        </tr>`;
      return;
    }

    tbody.innerHTML = data.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.MYIR || ""}</td>
        <td>${r.STO || ""}</td>
        <td>${r.MITRA || ""}</td>
        <td>${r.TEKNISI || ""}</td>
        <td>${r.KESIMPULAN || ""}</td>
        <td>${r.DETIL_KESIMPULAN || ""}</td>
        <td>${r.STATUS_MANJA || ""}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Modal fetch error:", err);
    tbody.innerHTML = `<tr><td colspan="8">Gagal load data</td></tr>`;
  }
}

/* ================= SHOW MODAL KENDALA ================= */
async function showKendalaDetail(type, detail, cluster) {
  const modal = document.getElementById("modalDetail");
  const tbody = modal.querySelector("#modalTable tbody");
  if (!modal || !tbody) return;

  tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;
  openModal();

  try {
    let url = `${API_URL}?action=getkendala&type=${encodeURIComponent(type)}&detail=${encodeURIComponent(detail)}`;

    if (cluster) {
      url += `&cluster=${encodeURIComponent(cluster)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">Tidak ada data kendala</td>
        </tr>`;
      return;
    }

    tbody.innerHTML = data.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.MYIR || ""}</td>
        <td>${r.STO || ""}</td>
        <td>${r.MITRA || ""}</td>
        <td>${r.TEKNISI || ""}</td>
        <td>${r.KESIMPULAN || ""}</td>
        <td>${r.DETIL_KESIMPULAN || ""}</td>
        <td>${r.STATUS_MANJA || ""}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Modal Kendala error:", err);
    tbody.innerHTML = `<tr><td colspan="8">Gagal load data</td></tr>`;
  }
}

/* ================= EVENT CLICK HSA ================= */
function bindHSAClicks() {
  const tbody = document.querySelector("#tblHSA table tbody");
  if (!tbody) return;

  tbody.querySelectorAll("td.clickable").forEach(td => {
    td.style.cursor = "pointer";
    td.onclick = function () {
      const tr = this.parentElement;
      const sto = tr.children[0].innerText.trim();
      const type = this.dataset.type;

      if (sto && type) {
        showHSADetail(sto, type);
      }
    };
  });
}

// panggil ini setelah updateHSATable(data)
function updateHSATableWithModal(data) {
  updateHSATable(data);
  bindHSAClicks();
}

/* ================= EVENT CLICK KENDALA ================= */
function bindKendalaClicks() {
  document.querySelectorAll("#tblNonTeknik td.clickable, #tblTeknik td.clickable")
    .forEach(td => {
      td.style.cursor = "pointer";
      td.onclick = function () {
        const type = this.dataset.type;
        const detail = this.dataset.detail;
        const cluster = this.dataset.cluster;

        if (type && detail !== undefined) {
          showKendalaDetail(type, detail, cluster);
        }
      };
    });
}


function updateKesimpulan(data) {

  const wo = data.cards["WO PSB"]?.nilai || 0;
  const sisa = data.cards["SISA PROGRES"]?.nilai || 0;
  const pSisa = data.cards["SISA PROGRES"]?.persen || "0%";
  const sudah = data.cards["SUDAH PROGRES"]?.nilai || 0;
  const sukses = data.cards["SUKSES"]?.nilai || 0;
  const gagal = data.cards["GAGALTARIK"]?.nilai || 0;

  const kendalaList = data.kendalaPelangganTable || [];
  let kendalaTerbesar = kendalaList.length ? kendalaList[0] : null;

  const kesimpulanEl = document.getElementById("kesimpulanText");
  if (!kesimpulanEl) return;

  kesimpulanEl.innerHTML = `
    Berdasarkan hasil monitoring Fulfillment Indihome Tangerang, dari total 
    <b>${wo}</b> WO PSB terdapat <b>${sisa} (${pSisa})</b> WO yang masih berada pada tahap 
    <b>Sisa Progress</b>, sedangkan <b>${sudah}</b> WO telah masuk kategori <b>Sudah Progress</b>.<br><br>

    Seluruh WO yang telah diproses menunjukkan hasil <b>${sukses}</b> WO sukses dengan 
    <b>${gagal}</b> kasus gagal tarik, sehingga performa penyelesaian pekerjaan dapat dikategorikan 
    <b>baik</b>.<br><br>

    Kendala terbesar saat ini berasal dari kategori 
    <b>${kendalaTerbesar?.kendala || "-"}</b> sebanyak 
    <b>${kendalaTerbesar?.total || 0}</b> kasus. 
    Distribusi kendala pada cluster Kotang dan Tangsel relatif seimbang sehingga diperlukan 
    percepatan penanganan secara merata.<br><br>

    Secara keseluruhan fokus perbaikan perlu diarahkan pada percepatan penyelesaian Sisa Progress serta penanganan kendala pelanggan 
    agar target penyelesaian WO dapat tercapai secara optimal.
  `;
}
