function initKPI12(config) {
  const root = document.getElementById("kpi12-container");

  // ================== STATE KPI CARD ==================
  const state = {
    raw: [],
    filtered: [],
  };

  // ================== STATE GRID STO (web!A242:AP262) ==================
  const tableState = {
    headRows: [],  // [row1,row2,row3] header
    bodyRows: [],  // A249:AP261
    totalRow: null // A262 (TOTAL)
  };

  // ================== STATE RANKING ==================
  const rankingState = {
    hsa: [],   // { nama, point, rank }
    mitra: [], // { nama, point, rank }
  };

  // ================== ELEMENTS ==================
  const els = {
    // card (dibatasi di dalam root)
    header: root ? root.querySelector(".kpi12-header") : null,
    loading: document.getElementById("kpi12-loading"),
    error: document.getElementById("kpi12-error"),
    summaryRow: document.getElementById("kpi12-summary-row"),
    cardGrid: document.getElementById("kpi12-card-grid"),
    lastUpdate: document.getElementById("kpi12-last-update"),
    filterSegmen: document.getElementById("kpi12-filter-segmen"),
    refreshBtn: document.getElementById("kpi12-refresh"),

    // grid STO (thead 3 baris)
    headRow1: document.getElementById("kpi12-head-row-1"),
    headRow2: document.getElementById("kpi12-head-row-2"),
    headRow3: document.getElementById("kpi12-head-row-3"),
    tableBody: document.getElementById("kpi12-table-body"),
    tableFoot: document.getElementById("kpi12-table-foot"),

    // grid bobot kiri–kanan
    weightLeftTable: document.getElementById("kpi12-weight-left"),
    weightRightTable: document.getElementById("kpi12-weight-right"),
  };

  const IMG_BASE = "../../assets/home/img/";

  // ================== FETCH KPI CARD ==================
  async function fetchData() {
    showLoading(true);
    hideError();

    try {
      const url = `${config.baseUrl}?sheet=${encodeURIComponent(
        config.sheet
      )}&range=${encodeURIComponent(config.range)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error");

      const rows = await res.json();
      if (!Array.isArray(rows) || !rows.length) {
        state.raw = [];
        state.filtered = [];
        els.lastUpdate.textContent = "Last update: -";
        renderSummary();
        renderCards();
        return;
      }

      const header = rows[0].map((h) => (h || "").toString().trim());
      const dataRows = rows.slice(1);

      const idxIndikator = header.indexOf("Indikator");
      const idxTarget = header.indexOf("Target");
      const idxH1 = header.indexOf("H-1");
      const idxHI = header.indexOf("HI");

      state.raw = dataRows
        .filter(
          (r) =>
            r &&
            r.length > 0 &&
            String(r[idxIndikator] || "").trim() !== ""
        )
        .map((r, idx) => ({
          id: idx + 1,
          indikator: (r[idxIndikator] || "").toString(),
          target: toNumber(r[idxTarget]),
          h1: toNumber(r[idxH1]),
          hi: toNumber(r[idxHI]),
        }));

      state.filtered = [...state.raw];

      els.lastUpdate.textContent = "Last update: -";

      buildFilterOptions();
      renderSummary();
      renderCards();
    } catch (err) {
      console.error(err);
      showError("Gagal memuat data dari server.");
    } finally {
      showLoading(false);
    }
  }

  // ================== FETCH GRID STO (3 HEADER ROWS) ==================
  async function fetchTableData() {
    try {
      const url = `${config.baseUrl}?sheet=${encodeURIComponent(
        "web"
      )}&range=${encodeURIComponent("A242:AP262")}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error table");

      const rows = await res.json();
      if (!Array.isArray(rows) || !rows.length) {
        tableState.headRows = [];
        tableState.bodyRows = [];
        tableState.totalRow = null;
        renderTableHeaders();
        renderTable();
        return;
      }

      const offset = 242;
      const getRow = (rowNumber) => rows[rowNumber - offset] || null;

      // header + body
      const row1 = getRow(246) || [];      // indikator
      const row2 = getRow(247) || [];      // Target + angka
      const row3 = getRow(248) || [];      // H-1 / 🔄 / HI
      const bodyRows = rows.slice(249 - offset, 261 - offset + 1); // A249:A261

      // total murni dari source: web!A262:AP262
      const totalRow = getRow(262) || [];

      tableState.headRows = [row1, row2, row3];
      tableState.bodyRows = bodyRows;
      tableState.totalRow = totalRow;

      renderTableHeaders();
      renderTable();
    } catch (err) {
      console.error(err);
    }
  }

  // ================== FETCH GRID BOBOT KPI (web!A212:P225) ==================
  async function fetchWeightTable() {
    try {
      const url = `${config.baseUrl}?sheet=${encodeURIComponent(
        "web"
      )}&range=${encodeURIComponent("A212:P225")}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error weight");

      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length < 2) {
        renderWeightTables([], []);
        return;
      }

      const header = rows[0];         // Indikator, Bobot, Target, GDS, TAN, ...
      const dataRows = rows.slice(1); // baris indikator

      renderWeightTables(header, dataRows);
    } catch (err) {
      console.error(err);
      renderWeightTables([], []);
    }
  }

  // ================== FETCH RANKING HSA & MITRA ==================
  async function fetchRanking() {
    try {
      // HSA: web!A230:C235
      const urlHsa = `${config.baseUrl}?sheet=${encodeURIComponent(
        "web"
      )}&range=${encodeURIComponent("A230:C235")}`;

      const resHsa = await fetch(urlHsa);
      if (!resHsa.ok) throw new Error("Network error ranking HSA");
      const rowsHsa = await resHsa.json();

      rankingState.hsa = [];
      if (Array.isArray(rowsHsa) && rowsHsa.length > 1) {
        const dataRows = rowsHsa.slice(1);
        rankingState.hsa = dataRows
          .filter(r => r && r[0])
          .map(r => ({
            nama: r[0],
            point: toNumber(r[1]),
            rank: Number(r[2]),
          }))
          .sort((a, b) => a.rank - b.rank);
      }

      // MITRA: web!A238:C243
      const urlMitra = `${config.baseUrl}?sheet=${encodeURIComponent(
        "web"
      )}&range=${encodeURIComponent("A238:C243")}`;

      const resMitra = await fetch(urlMitra);
      if (!resMitra.ok) throw new Error("Network error ranking MITRA");
      const rowsMitra = await resMitra.json();

      rankingState.mitra = [];
      if (Array.isArray(rowsMitra) && rowsMitra.length > 1) {
        const dataRows = rowsMitra.slice(1);
        rankingState.mitra = dataRows
          .filter(r => r && r[0])
          .map(r => ({
            nama: r[0],
            point: toNumber(r[1]),
            rank: Number(r[2]),
          }))
          .sort((a, b) => a.rank - b.rank);
      }

      renderRankingTable();
    } catch (err) {
      console.error(err);
      rankingState.hsa = [];
      rankingState.mitra = [];
      renderRankingTable();
    }
  }

  // ================== UTIL ==================
  function toNumber(v) {
  if (v === null || v === undefined || v === "") return NaN;
  if (typeof v === "string") {
    const cleaned = v.replace(/\./g, "").replace(",", ".");
    const num = Number(cleaned);
    return isNaN(num) ? Number(v) : num;
  }
  return Number(v);
}

function formatNumberCell(v, decimals = 2) {
  if (v === null || v === undefined || v === "") return "";
  const num = typeof v === "number" ? v : Number(
    v.toString().replace(/\./g, "").replace(",", ".")
  );
  if (!isFinite(num)) return v;
  return num.toFixed(decimals);
}


  // avatar HSA juara/kalah
  function getHsaAvatar(nama, isWinner) {
    const key = (nama || "").toLowerCase();
    if (key === "zulfa") return isWinner ? "zulfa_juara.png" : "zulfa_kalah.png";
    if (key === "dady") return isWinner ? "dadi_juara.png" : "dadi_kalah.png";
    if (key === "eka") return isWinner ? "eka_juara.png" : "eka_kalah.png";
    if (key === "risman") return isWinner ? "risman_juara.png" : "risman_kalah.png";
    if (key === "herlando") return isWinner ? "herlando_juara.png" : "herlando_kalah.png";
    // default
    return "default.png";
  }

  function getMedalIcon(rank) {
    if (rank === 1) return "platinum.png";
    if (rank === 2) return "gold.png";
    if (rank === 3) return "silver.png";
    return null;
  }

  // ================== FILTER & SELECT (CARD) ==================
  function buildFilterOptions() {
    const indikatorList = new Set();
    state.raw.forEach((row) => {
      if (row.indikator) indikatorList.add(row.indikator);
    });

    fillSelect(
      els.filterSegmen,
      Array.from(indikatorList).sort(),
      "All Indikator"
    );
  }

  function fillSelect(selectEl, items, allLabel) {
    const current = selectEl.value;
    selectEl.innerHTML = "";

    const optAll = document.createElement("option");
    optAll.value = "ALL";
    optAll.textContent = allLabel;
    selectEl.appendChild(optAll);

    items.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    });

    if ([...selectEl.options].some((o) => o.value === current)) {
      selectEl.value = current;
    } else {
      selectEl.value = "ALL";
    }
  }

  function applyFilter() {
    const indikatorFilter = els.filterSegmen.value;

    state.filtered = state.raw.filter((r) => {
      const okIndikator =
        indikatorFilter === "ALL" || r.indikator === indikatorFilter;
      return okIndikator;
    });

    renderSummary();
    renderCards();
  }

  // ================== SUMMARY & CARDS ==================
  function renderSummary() {
    els.summaryRow.innerHTML = "";
    const medalEl = document.getElementById("kpi12-medal-icon");

    if (!state.filtered.length) {
      if (medalEl) medalEl.innerHTML = "";
      if (els.header) {
        els.header.classList.remove(
          "kpi12-header-gold",
          "kpi12-header-platinum",
          "kpi12-header-silver"
        );
      }
      return;
    }

    const total = state.filtered.length;
    const avgTarget =
      state.filtered.reduce((a, b) => a + (b.target || 0), 0) / total;
    const avgH1 =
      state.filtered.reduce((a, b) => a + (b.h1 || 0), 0) / total;
    const avgHI =
      state.filtered.reduce((a, b) => a + (b.hi || 0), 0) / total;

    const meetTargetCount = state.filtered.filter((r) => isMeetTarget(r)).length;

    const medal = getMedalByTotalMeet(meetTargetCount);

    if (medalEl) {
      medalEl.innerHTML = `
        <div class="kpi12-medal ${medal.cssClass}">
          <div class="kpi12-medal-img-wrap">
            <img src="${medal.img}" alt="${medal.level} Medal" class="kpi12-medal-img">
          </div>
          <div class="kpi12-medal-text">
            <div class="kpi12-medal-label">${medal.level}</div>
            <div class="kpi12-medal-caption">
              Meet: ${meetTargetCount} dari ${total} indikator
            </div>
          </div>
        </div>
      `;
    }

    if (els.header) {
      els.header.classList.remove(
        "kpi12-header-gold",
        "kpi12-header-platinum",
        "kpi12-header-silver"
      );
      if (medal.level === "Gold") {
        els.header.classList.add("kpi12-header-gold");
      } else if (medal.level === "Platinum") {
        els.header.classList.add("kpi12-header-platinum");
      } else if (medal.level === "Silver") {
        els.header.classList.add("kpi12-header-silver");
      }
    }

    const cards = [
      {
        title: "Jumlah Indikator",
        value: total,
        subtitle: "Total indikator laten dipantau",
        type: "primary",
        icon: "fa-list-check",
      },
      {
        title: "Rata-rata Target",
        value: isFinite(avgTarget) ? avgTarget.toFixed(2) + " %" : "-",
        subtitle: "Target rata-rata keseluruhan",
        type: "accent",
        icon: "fa-bullseye",
      },
      {
        title: "Rata-rata HI",
        value: isFinite(avgHI) ? avgHI.toFixed(2) + " %" : "-",
        subtitle: "Capaian hari ini (HI)",
        type: "success",
        icon: "fa-chart-line",
      },
      {
        title: "Comply / Not Comply",
        value: `${meetTargetCount} / ${total - meetTargetCount}`,
        subtitle: "Indikator yang mencapai target",
        type: "danger",
        icon: "fa-scale-balanced",
      },
    ];

    cards.forEach((c) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-xl-3";

      col.innerHTML = `
        <div class="kpi12-summary-card kpi12-summary-${c.type}">
          <div class="kpi12-summary-icon">
            <i class="fa ${c.icon}"></i>
          </div>
          <div class="kpi12-summary-body">
            <div class="kpi12-summary-title">${c.title}</div>
            <div class="kpi12-summary-value">${c.value}</div>
            <div class="kpi12-summary-subtitle">${c.subtitle}</div>
          </div>
        </div>
      `;
      els.summaryRow.appendChild(col);
    });
  }

  function renderCards() {
    els.cardGrid.innerHTML = "";
    if (!state.filtered.length) {
      els.cardGrid.innerHTML =
        '<div class="text-center text-muted py-4">Tidak ada data untuk filter saat ini.</div>';
      return;
    }

    state.filtered.forEach((row) => {
      const moodClass = getMoodClass(row);
      const card = document.createElement("div");
      card.className = `kpi12-card ${moodClass}`;

      const deltaH1 = calcDelta(row.h1, row.target);
      const deltaHI = calcDelta(row.hi, row.target);

      card.innerHTML = `
        <div class="kpi12-card-header">
          <div>
            <div class="kpi12-card-title">${row.indikator || "-"}</div>
          </div>
          <div class="kpi12-card-badge ${isMeetTarget(row) ? "kpi12-badge-comply" : "kpi12-badge-not-comply"}">
            ${isMeetTarget(row) ? "Comply" : "Not Comply"}
          </div>
        </div>

        <div class="kpi12-card-body">
          <div class="kpi12-metric-row">
            <div class="kpi12-metric-block">
              <div class="kpi12-metric-label">Target</div>
              <div class="kpi12-metric-value">${formatPercent(row.target)}</div>
            </div>
            <div class="kpi12-metric-block">
              <div class="kpi12-metric-label">H-1</div>
              <div class="kpi12-metric-value">${formatPercent(row.h1)}</div>
              <div class="kpi12-metric-delta ${deltaClass(deltaH1)}">
                ${formatDelta(deltaH1)}
              </div>
            </div>
            <div class="kpi12-metric-block">
              <div class="kpi12-metric-label">HI</div>
              <div class="kpi12-metric-value">${formatPercent(row.hi)}</div>
              <div class="kpi12-metric-delta ${deltaClass(deltaHI)}">
                ${formatDelta(deltaHI)}
              </div>
            </div>
          </div>

          <div class="kpi12-card-bar">
            <div class="kpi12-card-bar-fill" style="width:${normalizePercent(
              row.hi
            )}%"></div>
          </div>
        </div>

        <div class="kpi12-card-footer">
          <span class="kpi12-chip">
            HI ≥ Target
          </span>
          <span class="kpi12-chip">
            Mendekati Target (±5 pt)
          </span>
          <span class="kpi12-chip">
            Jauh di bawah Target
          </span>
        </div>
      `;
      els.cardGrid.appendChild(card);
    });
  }

  // ================== HELPER KPI CARD ==================
  function calcDelta(value, target) {
    if (!isFinite(value) || !isFinite(target)) return NaN;
    return value - target;
  }

  function formatPercent(v) {
    if (!isFinite(v)) return "-";
    return v.toFixed(2) + " %";
  }

  function formatDelta(d) {
    if (!isFinite(d) || d === 0) return "±0.00";
    const sign = d > 0 ? "+" : "";
    return `${sign}${d.toFixed(2)} pt`;
  }

  function deltaClass(d) {
    if (!isFinite(d) || d === 0) return "kpi12-delta-neutral";
    if (d > 0) return "kpi12-delta-up";
    return "kpi12-delta-down";
  }

  function normalizePercent(v) {
    if (!isFinite(v)) return 0;
    if (v < 0) return 0;
    if (v > 120) return 120;
    return v;
  }

  function isMeetTarget(r) {
    if (!isFinite(r.hi) || !isFinite(r.target)) return false;
    return r.hi >= r.target;
  }

  function getMoodClass(r) {
    if (!isFinite(r.hi) || !isFinite(r.target)) return "";
    const diff = r.hi - r.target;
    if (diff >= 0) return "kpi12-card-good";
    if (diff >= -5) return "kpi12-card-warning";
    return "kpi12-card-bad";
  }

  function getMedalByTotalMeet(totalMeet) {
    if (totalMeet >= 12) {
      return {
        level: "Platinum",
        img: IMG_BASE + "platinum.png",
        cssClass: "kpi12-medal-platinum",
      };
    }
    if (totalMeet >= 10) {
      return {
        level: "Gold",
        img: IMG_BASE + "gold.png",
        cssClass: "kpi12-medal-gold",
      };
    }
    return {
      level: "Silver",
      img: IMG_BASE + "silver.png",
      cssClass: "kpi12-medal-silver",
    };
  }

// ================== GRID HEADER 3 BARIS ==================
function renderTableHeaders() {
  const [row1 = [], row2 = [], row3 = []] = tableState.headRows;
  if (!els.headRow1 || !els.headRow2 || !els.headRow3) return;

  els.headRow1.innerHTML = "";
  els.headRow2.innerHTML = "";
  els.headRow3.innerHTML = "";

  const fixedFirstCols = 4; // STO, Cluster, OM HAS, MITRA

  // ===== BARIS 1 =====
  // 4 kolom awal: rowSpan 3
  for (let i = 0; i < fixedFirstCols; i++) {
    const th = document.createElement("th");
    const title = (row1[i] || "").toString();
    const colorClass = getStoKpiHeaderClass(title);
    th.textContent = title;
    th.className = `text-center align-middle kpi12-sto-head-base ${colorClass}`;
    th.style.fontSize = "0.8rem";
    th.rowSpan = 3;
    els.headRow1.appendChild(th);
  }

  const medalIndex = row1.indexOf("Medal");
  const achIndex = row1.indexOf("Ach");
  const indicatorsStartCol = fixedFirstCols;
  const indicatorsEndCol = medalIndex === -1 ? row1.length : medalIndex;

  // list indikator dengan index kolom sheet
  const indicators = [];
  for (let c = indicatorsStartCol; c < indicatorsEndCol; c++) {
    const title = (row1[c] || "").toString().trim();
    if (!title) continue;
    indicators.push({ title, colIndex: c });
  }

  // Baris 1: setiap indikator 1 kolom, colSpan = 3, pakai wrapper biar lebar rata
  indicators.forEach(({ title }) => {
    const th = document.createElement("th");
    const colorClass = getStoKpiHeaderClass(title);
    th.className =
      `text-center align-middle kpi12-sto-head-base ` +
      `kpi12-sto-head-indikator ${colorClass}`;
    th.style.fontSize = "0.75rem";
    th.colSpan = 3;

    const span = document.createElement("span");
    span.className = "kpi12-sto-head-label";
    span.textContent = title;

    th.appendChild(span);
    els.headRow1.appendChild(th);
  });

  // Medal & Ach rowSpan 3
  if (medalIndex !== -1) {
    const thMedal = document.createElement("th");
    const colorClass = getStoKpiHeaderClass("Medal");
    thMedal.textContent = "Medal";
    thMedal.className = `text-center align-middle kpi12-sto-head-base ${colorClass}`;
    thMedal.style.fontSize = "0.75rem";
    thMedal.rowSpan = 3;
    els.headRow1.appendChild(thMedal);
  }
  if (achIndex !== -1) {
    const thAch = document.createElement("th");
    const colorClass = getStoKpiHeaderClass("Ach");
    thAch.textContent = "Ach";
    thAch.className = `text-center align-middle kpi12-sto-head-base ${colorClass}`;
    thAch.style.fontSize = "0.75rem";
    thAch.rowSpan = 3;
    els.headRow1.appendChild(thAch);
  }

  // ===== BARIS 2: Target (colSpan 2) + angka =====
  // 4 kolom awal: dummy
  for (let i = 0; i < fixedFirstCols; i++) {
    const th = document.createElement("th");
    th.className = "d-none";
    els.headRow2.appendChild(th);
  }

  // ambil angka target dari row2 (urutan sesuai indikator)
  const targetValues = [];
  for (let i = indicatorsStartCol; i < row2.length; i++) {
    const val = (row2[i] || "").toString().trim();
    if (!val) continue;
    const num = toNumber(val);
    if (isFinite(num)) targetValues.push(val);
  }
  while (targetValues.length < indicators.length) targetValues.push("");

  indicators.forEach((_, idx) => {
    const value = targetValues[idx] || "";

    // kolom 1-2: gabungan "Target"
    const thTargetSpan = document.createElement("th");
    thTargetSpan.textContent = "Target";
    thTargetSpan.className = "text-center align-middle";
    thTargetSpan.style.fontSize = "0.7rem";
    thTargetSpan.colSpan = 2;
    els.headRow2.appendChild(thTargetSpan);

    // kolom ke-3: angka target
    const thValue = document.createElement("th");
    thValue.textContent = value;
    thValue.className = "text-center align-middle";
    thValue.style.fontSize = "0.7rem";
    els.headRow2.appendChild(thValue);
  });

  // Medal & Ach dummy di baris 2
  if (medalIndex !== -1) {
    const thMedal = document.createElement("th");
    thMedal.className = "d-none";
    els.headRow2.appendChild(thMedal);
  }
  if (achIndex !== -1) {
    const thAch = document.createElement("th");
    thAch.className = "d-none";
    els.headRow2.appendChild(thAch);
  }

  els.headRow2.classList.add("kpi12-sto-row-target");

  // ===== BARIS 3: H-1 | 🔄 | HI =====
  // 4 kolom awal: dummy
  for (let i = 0; i < fixedFirstCols; i++) {
    const th = document.createElement("th");
    th.className = "d-none";
    els.headRow3.appendChild(th);
  }

  // row3 di sheet: H-1, 🔄, HI berulang, mulai dari kolom indikatorStartCol
  let r3Index = indicatorsStartCol;
  indicators.forEach(() => {
    for (let step = 0; step < 3; step++) {
      const text = (row3[r3Index] || "").toString().trim();
      const th = document.createElement("th");
      th.textContent = text;
      th.className = "text-center align-middle";
      th.style.fontSize = "0.7rem";
      els.headRow3.appendChild(th);
      r3Index += 1;
    }
  });

  // Medal & Ach dummy di baris 3
  if (medalIndex !== -1) {
    const thMedal = document.createElement("th");
    thMedal.className = "d-none";
    els.headRow3.appendChild(thMedal);
  }
  if (achIndex !== -1) {
    const thAch = document.createElement("th");
    thAch.className = "d-none";
    els.headRow3.appendChild(thAch);
  }
}

  // ================== GRID BODY & TOTAL ==================
function renderTable() {
  if (!els.tableBody) return;

  els.tableBody.innerHTML = "";

  const [row1, row2, row3] = tableState.headRows;

  // map target per kolom dari baris 2 (angka saja)
  const targetByCol = {};
  if (Array.isArray(row2)) {
    for (let i = 0; i < row2.length; i++) {
      const val = toNumber(row2[i]);
      if (isFinite(val)) targetByCol[i] = val;
    }
  }

  tableState.bodyRows.forEach((row) => {
    if (!row || !row.length) return;

    const tr = document.createElement("tr");

    // styling row berdasarkan medal (opsional, tetap dipakai)
    const medalText = (row[row.length - 2] || "").toString().trim();
    const medalLower = medalText.toLowerCase();
    if (medalLower === "platinum") tr.classList.add("table-platinum");
    else if (medalLower === "gold") tr.classList.add("table-gold");

    // baris total Branch Tangerang di body (jika ada)
    const firstCell = (row[0] || "").toString().trim();
    if (firstCell === "Branch Tangerang") {
      tr.classList.add("kpi12-sto-row-total");
    }

    const colCount = tableState.headRows[0]?.length || row.length;

    for (let i = 0; i < colCount; i++) {
      const td = document.createElement("td");
      td.className = "text-center";

      const raw = row[i];

      // deteksi kolom Medal = kolom sebelum Ach (kolom terakhir)
      const isMedalCol = (i === colCount - 2);

      if (isMedalCol) {
        const medal = (raw || "").toString().trim();
        const medalLowerCase = medal.toLowerCase();

        let medalClass = "";
        if (medalLowerCase === "platinum") medalClass = "kpi12-medal-platinum";
        else if (medalLowerCase === "gold") medalClass = "kpi12-medal-gold";
        else if (medalLowerCase === "silver") medalClass = "kpi12-medal-silver";
        else if (medalLowerCase === "bronze") medalClass = "kpi12-medal-bronze";

        if (medalClass) {
          td.innerHTML =
            `<span class="kpi12-medal-badge ${medalClass}">${medal}</span>`;
        } else {
          td.textContent = medal;
        }
      } else {
        td.textContent = raw ?? "";
      }

      // label baris ketiga: H-1 / 🔄 / HI
      const label3 = (row3?.[i] || "").toString().trim();
      const target = targetByCol[i];

      // hanya untuk kolom H-1 / HI dan kalau ada target
      if (!isMedalCol && isFinite(target) && (label3 === "H-1" || label3 === "HI")) {
        const valNum = toNumber(raw);
        if (isFinite(valNum) && valNum < target) {
          td.classList.add("kpi12-sto-cell-below-target"); // merah
        }
      }

      tr.appendChild(td);
    }

    els.tableBody.appendChild(tr);
  });

  // FOOT: total Branch Tangerang (sudah ada di tableState.totalRow)
  if (els.tableFoot) {
    els.tableFoot.innerHTML = "";
    if (tableState.totalRow) {
      const trTotal = document.createElement("tr");
      trTotal.className = "kpi12-table-total-row fw-semibold kpi12-sto-row-total";

      const colCount = tableState.headRows[0]?.length || tableState.totalRow.length;

      for (let i = 0; i < colCount; i++) {
        const td = document.createElement("td");
        td.className = "text-center";

        if (i === 0) {
          // merge A262:D262
          td.colSpan = 4;
          td.textContent = tableState.totalRow[0] ?? "";
          td.style.textAlign = "left";
          trTotal.appendChild(td);
          i = 3;
          continue;
        }

        td.textContent = tableState.totalRow[i] ?? "";
        trTotal.appendChild(td);
      }

      els.tableFoot.appendChild(trTotal);
    }
  }
}


  function getStoKpiHeaderClass(title) {
  const t = (title || "").toString().trim();

  // abu-abu tua
  if (["STO","Telkomsel Cluster","OM HAS","MITRA","Medal","Ach"].includes(t))
    return "kpi12-sto-head-abu";

  // biru dongker
  if (["Assurance Guarantee","TTR Compliance 36H (non HVC)"].includes(t))
    return "kpi12-sto-head-biru";

  // hijau tua
  if (t === "Underspec DATIN") return "kpi12-sto-head-hijau";

  // oranye
  if (t === "TTR Compliance K3 DATIN 7,2 Jam") return "kpi12-sto-head-orange";

  // hijau toska
  if (t === "TTDC Wifi") return "kpi12-sto-head-toska";

  // ungu tua
  if (["MTTRi Compliance Premium","MTTRi Compliance Critical","Latency RAN to Core"].includes(t))
    return "kpi12-sto-head-ungu";

  // kuning tua
  if (["TTI Compliance","TTR Compliance FFG","PS/RE Indihome"].includes(t))
    return "kpi12-sto-head-kuning";

  // pink tua
  if (t === "Stock NTE Ebis") return "kpi12-sto-head-pink";

  return "";
}

  
  function getStoHeaderClass(stoName) {
  const key = (stoName || "").toString().trim().toUpperCase();

  // biru dongker
  if (["GDS", "TAN", "JIA"].includes(key)) return "kpi12-weight-head-biru";

  // oranye
  if (["CPD", "CKL", "DTG"].includes(key)) return "kpi12-weight-head-orange";

  // hijau tua
  if (["CLD", "PDR", "PKU"].includes(key)) return "kpi12-weight-head-hijau";

  // ungu tua
  if (["LKG", "SRP"].includes(key)) return "kpi12-weight-head-ungu";

  // pink tua
  if (["SRH", "CPA"].includes(key)) return "kpi12-weight-head-pink";

  return "";
}

  
  // ================== GRID BOBOT KANAN ==================
  function renderWeightTables(header, dataRows) {
  if (!els.weightLeftTable || !els.weightRightTable) return;

  els.weightRightTable.innerHTML = "";
  if (!header.length || !dataRows.length) return;

  const stoHeaders = header.slice(3); // GDS..CPA

  const buildTableHtml = (stoList, offsetIndex) => {
    let theadHtml = "<thead><tr>";

    // 3 kolom awal: abu-abu gelap
    theadHtml += `<th class="text-center kpi12-weight-head-base kpi12-weight-head-indikator">Indikator</th>`;
    theadHtml += `<th class="text-center kpi12-weight-head-base kpi12-weight-head-bobot">Bobot</th>`;
    theadHtml += `<th class="text-center kpi12-weight-head-base kpi12-weight-head-target">Target</th>`;

    // STO: warna sesuai mapping
    stoList.forEach((sto) => {
      const stoText = (sto || "").toString();
      const stoClass = getStoHeaderClass(stoText);
      theadHtml += `
        <th class="text-center kpi12-weight-head-base ${stoClass}">
          ${stoText}
        </th>`;
    });

    theadHtml += "</tr></thead>";

    // ... (tbody seperti jawaban sebelumnya, tidak diubah)
    let tbodyHtml = "<tbody>";
    dataRows.forEach((row) => {
      if (!row || !row.length) return;
      const indikator = row[0] ?? "";
      const bobotNum = toNumber(row[1]);
      const bobot = formatNumberCell(row[1], 0);
      const target = formatNumberCell(row[2], 2);

      tbodyHtml += "<tr>";
      tbodyHtml += `<td>${indikator}</td>`;
      tbodyHtml += `<td class="text-center">${bobot}</td>`;
      tbodyHtml += `<td class="text-center">${target}</td>`;

      stoList.forEach((_, idx) => {
        const colIndex = offsetIndex + idx;
        const valRaw = row[colIndex];
        const valNum = toNumber(valRaw);
        const val = formatNumberCell(valRaw, 2);

        const isBelow = isFinite(valNum) && isFinite(bobotNum) && valNum < bobotNum;
        const cls = isBelow ? "kpi12-weight-below-bobot" : "";

        tbodyHtml += `<td class="text-center ${cls}">${val}</td>`;
      });

      tbodyHtml += "</tr>";
    });
    tbodyHtml += "</tbody>";

    return theadHtml + tbodyHtml;
  };

  els.weightRightTable.innerHTML = buildTableHtml(stoHeaders, 3);
  renderRankingTable();
}

  function renderRankingTable() {
  if (!els.weightLeftTable) return;

  const hsa = rankingState.hsa || [];
  const mitra = rankingState.mitra || [];

  let html = "<tbody>";

  // ====== BLOK RANKING HSA ======
  html += `
    <tr>
      <td colspan="4" class="p-0 kpi12-ranking-cell">
        <div class="kpi12-ranking-section">
          <div class="kpi12-ranking-title">Ranking HSA</div>
  `;

  const topHsa = hsa.filter(x => x.rank >= 1 && x.rank <= 3);
  if (topHsa.length) {
    html += `<div class="kpi12-ranking-top">`;
    topHsa.forEach(item => {
      const medalIcon = getMedalIcon(item.rank);
      const avatar = getHsaAvatar(item.nama, true);
      html += `
        <div class="kpi12-ranking-card">
          <div class="kpi12-ranking-card-row">
            <div class="kpi12-ranking-col-left">
              ${medalIcon ? `
                <img src="${IMG_BASE + medalIcon}" class="kpi12-ranking-medal-vertical" alt="Medal ${item.rank}">
              ` : ""}
            </div>
            <div class="kpi12-ranking-col-middle">
              <div class="kpi12-ranking-rank-label">Rank #${item.rank}</div>
              <div class="kpi12-ranking-name">${item.nama}</div>
              <div class="kpi12-ranking-point">Point: ${formatNumberCell(item.point, 1)}</div>
            </div>
            <div class="kpi12-ranking-col-right">
              <img src="${IMG_BASE + avatar}" class="kpi12-ranking-avatar-side" alt="${item.nama}">
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  const otherHsa = hsa.filter(x => x.rank >= 4);
  if (otherHsa.length) {
    html += `
      <div class="kpi12-ranking-list mt-2">
        <div class="kpi12-ranking-list-title">Peringkat lainnya</div>
    `;
    otherHsa.forEach(item => {
      const avatar = getHsaAvatar(item.nama, false);
      html += `
        <div class="kpi12-ranking-list-item d-flex align-items-center">
          <div class="kpi12-ranking-list-rank">#${item.rank}</div>
          <img src="${IMG_BASE + avatar}" class="kpi12-ranking-avatar-sm mx-2" alt="${item.nama}">
          <div>
            <div class="kpi12-ranking-name">${item.nama}</div>
            <div class="kpi12-ranking-point small text-muted">Point: ${formatNumberCell(item.point, 1)}</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  html += `
        </div>
      </td>
    </tr>
  `;

  // ====== BLOK RANKING MITRA ======
  html += `
    <tr>
      <td colspan="4" class="p-0 kpi12-ranking-cell">
        <div class="kpi12-ranking-section mt-3">
          <div class="kpi12-ranking-title">Ranking MITRA</div>
  `;

  const topMitra = mitra.filter(x => x.rank >= 1 && x.rank <= 3);
  if (topMitra.length) {
    html += `<div class="kpi12-ranking-top">`;
    topMitra.forEach(item => {
      const medalIcon = getMedalIcon(item.rank);
      html += `
        <div class="kpi12-ranking-card">
          <div class="kpi12-ranking-card-row">
            <div class="kpi12-ranking-col-left">
              ${medalIcon ? `
                <img src="${IMG_BASE + medalIcon}" class="kpi12-ranking-medal-vertical" alt="Medal ${item.rank}">
              ` : ""}
            </div>
            <div class="kpi12-ranking-col-middle">
              <div class="kpi12-ranking-rank-label">Rank #${item.rank}</div>
              <div class="kpi12-ranking-name">${item.nama}</div>
              <div class="kpi12-ranking-point">Point: ${formatNumberCell(item.point, 1)}</div>
            </div>
            <div class="kpi12-ranking-col-right">
              <img src="${IMG_BASE}default.png" class="kpi12-ranking-avatar-side" alt="${item.nama}">
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  const otherMitra = mitra.filter(x => x.rank >= 4);
  if (otherMitra.length) {
    html += `
      <div class="kpi12-ranking-list mt-2">
        <div class="kpi12-ranking-list-title">Peringkat lainnya</div>
    `;
    otherMitra.forEach(item => {
      html += `
        <div class="kpi12-ranking-list-item d-flex align-items-center">
          <div class="kpi12-ranking-list-rank">#${item.rank}</div>
          <div class="ms-2">
            <div class="kpi12-ranking-name">${item.nama}</div>
            <div class="kpi12-ranking-point small text-muted">Point: ${formatNumberCell(item.point, 1)}</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  html += `
        </div>
      </td>
    </tr>
  `;

  html += "</tbody>";

  els.weightLeftTable.innerHTML = html;
}

  // ================== SHOW/HIDE ==================
  function showLoading(flag) {
    if (!els.loading) return;
    els.loading.style.display = flag ? "block" : "none";
  }

  function showError(msg) {
    if (!els.error) return;
    els.error.classList.remove("d-none");
    if (msg) els.error.textContent = msg;
  }

  function hideError() {
    if (!els.error) return;
    els.error.classList.add("d-none");
  }

  // ================== EVENTS ==================
  if (els.filterSegmen) {
    els.filterSegmen.addEventListener("change", applyFilter);
  }
  if (els.refreshBtn) {
    els.refreshBtn.addEventListener("click", () => {
      fetchData();
      fetchTableData();
      fetchWeightTable();
      fetchRanking();
    });
  }

  // ================== INIT ==================
  fetchData();
  fetchTableData();
  fetchWeightTable();
  fetchRanking();
}
