// ================= GLOBAL =================
let API_URL = "";
let filtersInitialized = false;
let lastParams = null;
let lastData = null;

window.refreshTimer = window.refreshTimer || null;

// ================= INIT =================
function initFunnelingTree(apiUrl) {
  API_URL = apiUrl + "?action=getfunnelingtree";

  const btn = document.getElementById("btnFilter");
  if (btn) {
    btn.addEventListener("click", loadIndihomeData);
  }

  loadIndihomeData();

  if (window.refreshTimer) clearInterval(window.refreshTimer);
  window.refreshTimer = setInterval(loadIndihomeData, 60000);
}

window.initFunnelingTree = initFunnelingTree;

// ================= LOAD DATA =================
async function loadIndihomeData() {
  try {
    showLoading(true);

    const hsaEl = document.getElementById("filterHSA");
    const stoEl = document.getElementById("filterSTO");
    const startEl = document.getElementById("startDate");
    const endEl = document.getElementById("endDate");

    const hsa = hsaEl ? hsaEl.value : "";
    const sto = stoEl ? stoEl.value : "";
    const start = startEl ? startEl.value : "";
    const end = endEl ? endEl.value : "";

    const params = { hsa, sto, start, end };

    if (
      lastParams &&
      JSON.stringify(lastParams) === JSON.stringify(params) &&
      lastData
    ) {
      console.log("PAKAI CACHE TREE");
      applyAllUpdates(lastData);
      showLoading(false);
      return;
    }

    const url =
      API_URL +
      "&hsa=" + encodeURIComponent(hsa) +
      "&sto=" + encodeURIComponent(sto) +
      "&start=" + encodeURIComponent(start) +
      "&end=" + encodeURIComponent(end);

    const res = await fetch(url);
    if (!res.ok) throw new Error("API Error");

    const data = await res.json();
    console.log("DATA TREE:", data);

    lastParams = params;
    lastData = data;

    fillFiltersOnce(data);
    applyAllUpdates(data);

    showLoading(false);
    renderLines();

  } catch (err) {
    console.error("Fetch error:", err);
    showError("Gagal load data dari server");
  }
}

function applyAllUpdates(data) {
  updateHeader(data);
  updateBoxes(data);
  updateClusterTable(data);
  updateManjaTable(data);
  updateHSATableWithModal(data);
  updateKendalaNonTeknik(data);
  updateKesimpulan(data);
}

// ================= UI STATE =================
function showLoading(show) {
  const box = document.getElementById("loadingBox");
  if (box) box.style.display = show ? "block" : "none";
}

function showError(msg) {
  const area = document.getElementById("content-area");
  if (!area) return;
  area.innerHTML = `
    <div class="alert alert-danger text-center">
      <b>Error:</b> ${msg}
    </div>
  `;
}

// ================= FILTER DROPDOWN (HSA/STO) =================
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

// ================= HEADER =================
function updateHeader(data) {
  const time = new Date(data.updateTime);
  const el = document.getElementById("updateTime");
  if (el && !isNaN(time)) {
    el.innerText = "Last Update : " + time.toLocaleString("id-ID");
  }
}

// ================= BOX =================
function updateBoxes(data) {
  const cards = data.cards || {};

  const wo       = cards["WO PSB"]?.nilai || 0;
  const sisa     = cards["SISA PROGRES"]?.nilai || 0;
  const sudah    = cards["SUDAH PROGRES"]?.nilai || 0;
  const manja    = cards["MANJA HI EXP"]?.nilai || 0;
  const nonManja = cards["MANJA H+ & NON MANJA"]?.nilai || 0;
  const sukses   = cards["SUKSES"]?.nilai || 0;
  const gagal    = cards["GAGALTARIK"]?.nilai || 0;
  const psEnd    = cards["PS END STATE"]?.nilai || 0;
  const ogpEnd   = cards["OGP TARIK PS END STATE"]?.nilai || 0;

  const pSisa     = cards["SISA PROGRES"]?.persen || "0%";
  const pSudah    = cards["SUDAH PROGRES"]?.persen || "0%";
  const pManja    = cards["MANJA HI EXP"]?.persen || "0%";
  const pNonManja = cards["MANJA H+ & NON MANJA"]?.persen || "0%";
  const pSukses   = cards["SUKSES"]?.persen || "0%";
  const pGagal    = cards["GAGALTARIK"]?.persen || "0%";
  const pPsEnd    = cards["PS END STATE"]?.persen || "0%";
  const pOgpEnd   = cards["OGP TARIK PS END STATE"]?.persen || "0%";

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

function setBox(id, value) {
  const box = document.getElementById(id);
  if (!box) return;
  const b = box.querySelector("b");
  if (b) b.innerText = value;
}

function setBoxValuePercent(id, value, percentText) {
  const box = document.getElementById(id);
  if (!box) return;

  const b = box.querySelector("b");
  const small = box.querySelector("small");

  let percentFormatted = percentText;

  if (typeof percentText === "number") {
    percentFormatted = (percentText * 100).toFixed(2) + "%";
  } else if (typeof percentText === "string" && !percentText.includes("%")) {
    const num = parseFloat(percentText);
    if (!isNaN(num)) {
      percentFormatted = (num * 100).toFixed(2) + "%";
    }
  }

  if (b) b.innerText = value;
  if (small) small.innerText = percentFormatted;
}

// ================= TABLE CLUSTER (SISA) =================
function updateClusterTable(data) {
  const table = document.querySelector("#tblSisa table");
  if (!table) return;

  const rows = data.clusterTable || [];
  let html = `<tr><th>CLUSTER</th><th>TOTAL</th></tr>`;

  rows.forEach(row => {
    if (!row.cluster) return;
    html += `<tr><td>${row.cluster}</td><td>${row.total || 0}</td></tr>`;
  });

  table.innerHTML = html;
}

// ================= TABLE MANJA =================
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

// ================= TABLE HSA =================
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

function bindHSAClicks() {
  const tbody = document.querySelector("#tblHSA table tbody");
  if (!tbody) return;

  tbody.querySelectorAll("td.clickable").forEach(td => {
    td.style.cursor = "pointer";
    td.onclick = function () {
      const tr = this.parentElement;
      const sto = tr.children[0].innerText.trim();
      const type = this.dataset.type;
      if (sto && type) showHSADetail(sto, type);
    };
  });
}

function updateHSATableWithModal(data) {
  updateHSATable(data);
  bindHSAClicks();
}

// ================= TABEL KENDALA =================
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

// ================= GARIS ANTAR BOX =================
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

// ================= GARIS CARD → TABLE =================
function drawTableLines() {
  const svg = document.getElementById("tree-lines");
  if (!svg) return;

  svg.querySelectorAll(".card-table-line").forEach(line => line.remove());

  function drawLine(cardId, tableId) {
    const card = document.getElementById(cardId);
    const table = document.getElementById(tableId);
    if (!card || !table) return;

    const parent = document.querySelector(".tree-area").getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();

    let x1, y1, x2, y2, d;

    if (cardId === "gagal") {
      x1 = cardRect.left + cardRect.width / 2 - parent.left;
      y1 = cardRect.bottom - parent.top;

      x2 = tableRect.left + tableRect.width / 2 - parent.left;
      y2 = tableRect.top - parent.top;

      d = `M ${x1} ${y1} L ${x2} ${y2}`;
    } else {
      x1 = cardRect.left - parent.left;
      y1 = cardRect.top + cardRect.height / 2 - parent.top;

      x2 = tableRect.left - parent.left;
      y2 = tableRect.top + tableRect.height / 2 - parent.top;

      const midX = x1 - 40;

      d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
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

  drawLine("sisa", "tblSisa");
  drawLine("manja", "tblManja");
  drawLine("gagal", "tblNonTeknik");
}

// ================= POSISI TABEL & KESIMPULAN =================
function positionTablesBelowCards() {
  const parent = document.querySelector(".tree-area");
  if (!parent) return;
  // posisi diatur via CSS absolute, fungsi ini disiapkan kalau nanti mau dinamis
}

// ================= RENDER SEMUA GARIS =================
function renderLines() {
  positionTablesBelowCards();
  drawTreeLines();
  drawTableLines();
}

window.addEventListener("resize", renderLines);

// ================= MODAL DETAIL (CUSTOM) =================
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

window.addEventListener("click", function (e) {
  const modal = document.getElementById("modalDetail");
  if (!modal) return;
  if (e.target === modal) modal.style.display = "none";
});

// ================= SHOW MODAL HSA =================
async function showHSADetail(sto, type) {
  const modal = document.getElementById("modalDetail");
  const tbody = modal.querySelector("#modalTable tbody");
  if (!modal || !tbody) return;

  tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;
  openModal();

  try {
    const url = `${API_URL}&action=getwohi&sto=${encodeURIComponent(sto)}&type=${encodeURIComponent(type)}`;
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

// ================= SHOW MODAL KENDALA =================
async function showKendalaDetail(type, detail, cluster) {
  const modal = document.getElementById("modalDetail");
  const tbody = modal.querySelector("#modalTable tbody");
  if (!modal || !tbody) return;

  tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;
  openModal();

  try {
    let url = `${API_URL}&action=getkendala&type=${encodeURIComponent(type)}&detail=${encodeURIComponent(detail)}`;
    if (cluster) url += `&cluster=${encodeURIComponent(cluster)}`;

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

// ================= KESIMPULAN =================
function updateKesimpulan(data) {
  const wo     = data.cards["WO PSB"]?.nilai || 0;
  const sisa   = data.cards["SISA PROGRES"]?.nilai || 0;
  const pSisaRaw = data.cards["SISA PROGRES"]?.persen || 0;
  const sudah  = data.cards["SUDAH PROGRES"]?.nilai || 0;
  const sukses = data.cards["SUKSES"]?.nilai || 0;
  const gagal  = data.cards["GAGALTARIK"]?.nilai || 0;

  let pSisa = "0%";
  const num = parseFloat(pSisaRaw);
  if (!isNaN(num)) pSisa = (num * 100).toFixed(2) + "%";

  const kendalaList = data.kendalaPelangganTable || [];
  const kendalaTerbesar = kendalaList.length ? kendalaList[0] : { kendala: "-", total: 0 };

  const kesimpulanEl = document.getElementById("kesimpulanText");
  if (!kesimpulanEl) return;

  kesimpulanEl.innerHTML = `
    <span style="color:#0d6efd;"><i>Dari total</i></span> 
    <b style="color:#0d6efd;">${wo} WO PSB</b>, 
    <b style="color:#dc3545;">${sisa} (${pSisa})</b> masih berada pada kategori 
    <i style="color:#dc3545;">Sisa Progress</i>, sedangkan 
    <b style="color:#198754;">${sudah}</b> telah 
    <i style="color:#198754;">selesai diproses</i>. 
    Kinerja dinilai 
    <b style="color:#198754;">baik</b> dengan 
    <b style="color:#198754;">${sukses}</b> WO sukses dan 
    <b style="color:#6c757d;">${gagal}</b> gagal tarik. 
    Kendala dominan berasal dari 
    <i style="color:#fd7e14;">${kendalaTerbesar.kendala}</i> sebanyak 
    <b style="color:#fd7e14;">${kendalaTerbesar.total} kasus</b>.
    <br>
    <small><i style="color:#2c4b6c;">
      * Sumber data: WO HI Spreadsheet HD Fulfillment Branch <b>Tangerang</b>
    </i></small>
  `;
}
