function initKPI12(config) {
  // ================== STATE KPI CARD ==================
  const state = {
    raw: [],
    filtered: [],
  };

  // ================== STATE GRID STO (web!A242:AP262) ==================
  const tableState = {
    all: [],        // body STO (A249:AP261)
    headers: [],    // header flatten
    totalRow: null, // TANGERANG (A242)
  };

  // ================== ELEMENTS ==================
  const els = {
    // card
    header: document.querySelector(".kpi12-header"),
    loading: document.getElementById("kpi12-loading"),
    error: document.getElementById("kpi12-error"),
    summaryRow: document.getElementById("kpi12-summary-row"),
    cardGrid: document.getElementById("kpi12-card-grid"),
    lastUpdate: document.getElementById("kpi12-last-update"),
    filterSegmen: document.getElementById("kpi12-filter-segmen"),
    refreshBtn: document.getElementById("kpi12-refresh"),

    // grid STO
    tableHeadRow: document.getElementById("kpi12-table-head-row"),
    tableBody: document.getElementById("kpi12-table-body"),
    tableFoot: document.getElementById("kpi12-table-foot"),
  };

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

  // ================== FETCH GRID STO (NO PAGINATION) ==================
  async function fetchTableData() {
    try {
      const url = `${config.baseUrl}?sheet=${encodeURIComponent(
        "web"
      )}&range=${encodeURIComponent("A242:AP262")}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error table");

      const rows = await res.json();
      if (!Array.isArray(rows) || !rows.length) {
        tableState.all = [];
        tableState.headers = [];
        tableState.totalRow = null;
        renderTableHeaders([]);
        renderTable();
        return;
      }

      // offset A242 sebagai index 0
      const offset = 242;
      const getRow = (rowNumber) => rows[rowNumber - offset] || null;

      const totalRow = getRow(242); // TANGERANG total
      const headerRows = rows.slice(246 - offset, 248 - offset + 1); // A246:A248
      const bodyRows = rows.slice(249 - offset, 261 - offset + 1);   // A249:A261

      const flatHeaders = buildFlatHeaders(headerRows);

      // parse body STO pakai pattern 3 kolom (H-1, Δ, HI) per indikator
      const all = parseBodyRows(bodyRows, headerRows, flatHeaders);
      const totalObj = parseTotalRow(totalRow, headerRows);

      tableState.all = all;
      tableState.headers = flatHeaders;
      tableState.totalRow = totalObj;

      renderTableHeaders(flatHeaders);
      renderTable();
    } catch (err) {
      console.error(err);
      // optional: show error khusus tabel
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
    // grid STO terpisah, tidak ikut filter indikator
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
        img: "../../assets/home/img/platinum.png",
        cssClass: "kpi12-medal-platinum",
      };
    }
    if (totalMeet >= 10) {
      return {
        level: "Gold",
        img: "../../assets/home/img/gold.png",
        cssClass: "kpi12-medal-gold",
      };
    }
    return {
      level: "Silver",
      img: "../../assets/home/img/silver.png",
      cssClass: "kpi12-medal-silver",
    };
  }

  // ================== TABLE HEADER BUILDER ==================
  function buildFlatHeaders(headerRows) {
    const [row1 = [], row2 = [], row3 = []] = headerRows;

    const headers = [];

    // 4 kolom pertama fix
    headers.push({ label: "STO", key: "STO" });
    headers.push({ label: "Telkomsel Cluster", key: "Telkomsel Cluster" });
    headers.push({ label: "OM HAS", key: "OM HAS" });
    headers.push({ label: "MITRA", key: "MITRA" });

    const colCount = Math.max(row1.length, row2.length, row3.length);

    let col = 4;
    while (col < colCount) {
      const h1 = (row1[col] || "").toString().trim();
      const h2 = (row2[col] || "").toString().trim();
      const h3 = (row3[col] || "").toString().trim();

      // Medal & Ach sebagai kolom sendiri
      if (h1 === "Medal") {
        headers.push({ label: "Medal", key: "Medal" });
        col += 1;
        continue;
      }
      if (h1 === "Ach") {
        headers.push({ label: "Ach", key: "Ach" });
        col += 1;
        continue;
      }

      // blok metrik: pattern [H-1, 🔄, HI] per indikator
      const indikatorName = h1 || h2; // baris atas biasanya nama indikator
      if (!indikatorName) {
        col += 1;
        continue;
      }

      // pastikan masih cukup 3 kolom (H-1, emoji, HI)
      if (col + 2 >= colCount) break;

      // H-1
      headers.push({
        label: `${indikatorName} H-1`,
        key: `${indikatorName} H-1`,
      });
      // Δ (emoji 🔄)
      headers.push({
        label: `${indikatorName} Δ`,
        key: `${indikatorName} Delta`,
      });
      // HI
      headers.push({
        label: `${indikatorName} HI`,
        key: `${indikatorName} HI`,
      });

      col += 3;
    }

    return headers;
  }

  function parseBodyRows(bodyRows, headerRows) {
    const [row1 = [], row2 = [], row3 = []] = headerRows;

    return bodyRows
      .filter((r) => r && r.length)
      .map((r, idx) => {
        const obj = { id: idx + 1 };

        // 4 kolom awal
        obj["STO"] = r[0] ?? "";
        obj["Telkomsel Cluster"] = r[1] ?? "";
        obj["OM HAS"] = r[2] ?? "";
        obj["MITRA"] = r[3] ?? "";

        let col = 4;
        while (col < r.length) {
          const nameTop = (row1[col] || "").toString().trim();
          const nameMid = (row2[col] || "").toString().trim();
          const name = nameTop || nameMid;

          if (name === "Medal") {
            obj["Medal"] = r[col] ?? "";
            col += 1;
            continue;
          }
          if (name === "Ach") {
            obj["Ach"] = r[col] ?? "";
            col += 1;
            continue;
          }

          if (!name) {
            col += 1;
            continue;
          }

          // pastikan cukup 3 kolom (H-1, 🔄, HI)
          if (col + 2 >= r.length) break;

          const h1Val = r[col];       // H-1
          const deltaVal = r[col + 1]; // 🔄
          const hiVal = r[col + 2];   // HI

          obj[`${name} H-1`] = h1Val ?? "";
          obj[`${name} Delta`] = deltaVal ?? "";
          obj[`${name} HI`] = hiVal ?? "";

          col += 3;
        }

        return obj;
      });
  }

  function parseTotalRow(totalRow, headerRows) {
    if (!totalRow) return null;
    const [row1 = [], row2 = [], row3 = []] = headerRows;
    const obj = {};

    // 4 kolom pertama
    obj["STO"] = totalRow[0] ?? "";
    obj["Telkomsel Cluster"] = totalRow[1] ?? "";
    obj["OM HAS"] = totalRow[2] ?? "";
    obj["MITRA"] = totalRow[3] ?? "";

    let col = 4;
    while (col < totalRow.length) {
      const nameTop = (row1[col] || "").toString().trim();
      const nameMid = (row2[col] || "").toString().trim();
      const name = nameTop || nameMid;

      if (name === "Medal") {
        obj["Medal"] = totalRow[col] ?? "";
        col += 1;
        continue;
      }
      if (name === "Ach") {
        obj["Ach"] = totalRow[col] ?? "";
        col += 1;
        continue;
      }

      if (!name) {
        col += 1;
        continue;
      }

      if (col + 2 >= totalRow.length) break;

      const h1Val = totalRow[col];
      const deltaVal = totalRow[col + 1];
      const hiVal = totalRow[col + 2];

      obj[`${name} H-1`] = h1Val ?? "";
      obj[`${name} Delta`] = deltaVal ?? "";
      obj[`${name} HI`] = hiVal ?? "";

      col += 3;
    }

    return obj;
  }

  // ================== TABLE RENDER ==================
  function renderTableHeaders(flatHeaders) {
    if (!els.tableHeadRow) return;
    els.tableHeadRow.innerHTML = "";
    tableState.headers = flatHeaders || [];

    tableState.headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h.label;
      th.style.fontSize = "0.78rem";
      th.classList.add("text-center");
      els.tableHeadRow.appendChild(th);
    });
  }

  function renderTable() {
    if (!els.tableBody) return;

    els.tableBody.innerHTML = "";

    tableState.all.forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = getTableRowClass(row);

      const tds = tableState.headers.map((h) => {
        const val = row[h.key] ?? "";
        return `<td class="text-center">${val}</td>`;
      });

      tr.innerHTML = tds.join("");
      els.tableBody.appendChild(tr);
    });

    if (els.tableFoot) {
      els.tableFoot.innerHTML = "";
      if (tableState.totalRow) {
        const trTotal = document.createElement("tr");
        trTotal.className = "kpi12-table-total-row";
        const tdsTotal = tableState.headers.map((h) => {
          const val = tableState.totalRow[h.key] ?? "";
          return `<td class="text-center fw-semibold">${val}</td>`;
        });
        trTotal.innerHTML = tdsTotal.join("");
        els.tableFoot.appendChild(trTotal);
      }
    }
  }

  function getTableRowClass(row) {
    const medal = (row.Medal || row["Medal"] || "")
      .toString()
      .toLowerCase();
    if (medal === "platinum") return "table-platinum";
    if (medal === "gold") return "table-gold";
    return "";
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
    });
  }

  // ================== INIT ==================
  fetchData();      // KPI cards
  fetchTableData(); // Grid STO
}
