// js/kpi-12.js

function initKPI12(config) {
  // config: { baseUrl, sheet, range }
  const state = {
    raw: [],
    filtered: [],
  };

  const els = {
    loading: document.getElementById("kpi12-loading"),
    error: document.getElementById("kpi12-error"),
    summaryRow: document.getElementById("kpi12-summary-row"),
    cardGrid: document.getElementById("kpi12-card-grid"),
    lastUpdate: document.getElementById("kpi12-last-update"),
    filterSegmen: document.getElementById("kpi12-filter-segmen"),
    filterArea: document.getElementById("kpi12-filter-area"),
    refreshBtn: document.getElementById("kpi12-refresh"),
  };

  async function fetchData() {
    showLoading(true);
    hideError();

    try {
      const url = `${config.baseUrl}?sheet=${encodeURIComponent(
        config.sheet
      )}&range=${encodeURIComponent(config.range)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error");

      // Apps Script return langsung 2D array: [ [header...], [row1...], ... ]
      const rows = await res.json(); // 2D array

      if (!Array.isArray(rows) || !rows.length) {
        state.raw = [];
        els.lastUpdate.textContent = "Last update: -";
        renderSummary();
        renderCards();
        return;
      }

      // Baris pertama dianggap header
      const dataRows = rows.slice(1);

      // Mapping A:D (WEB!A1:D13)
      // Silakan adjust nama field kalau header-nya beda
      state.raw = dataRows.map((r, idx) => ({
        id: idx + 1,
        kategori: (r[0] || "").toString(), // A
        area: (r[1] || "").toString(),     // B
        nilai: Number(r[2] || 0),          // C
        status: (r[3] || "").toString(),   // D
      }));

      // Karena doGet tidak kirim updatedAt, pakai placeholder
      els.lastUpdate.textContent = "Last update: -";

      buildFilterOptions();
      applyFilter();
    } catch (err) {
      console.error(err);
      showError("Gagal memuat data dari server.");
    } finally {
      showLoading(false);
    }
  }

  function buildFilterOptions() {
    const segmens = new Set();
    const areas = new Set();

    state.raw.forEach((row) => {
      if (row.kategori) segmens.add(row.kategori);
      if (row.area) areas.add(row.area);
    });

    fillSelect(els.filterSegmen, Array.from(segmens).sort(), "All Segmen");
    fillSelect(els.filterArea, Array.from(areas).sort(), "All Area");
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
    const seg = els.filterSegmen.value;
    const area = els.filterArea.value;

    state.filtered = state.raw.filter((r) => {
      const okSeg = seg === "ALL" || r.kategori === seg;
      const okArea = area === "ALL" || r.area === area;
      return okSeg && okArea;
    });

    renderSummary();
    renderCards();
  }

  function renderSummary() {
    els.summaryRow.innerHTML = "";
    if (!state.filtered.length) return;

    const total = state.filtered.length;
    const avg =
      state.filtered.reduce((a, b) => a + (b.nilai || 0), 0) / total;

    const greenCount = state.filtered.filter((r) => isGood(r)).length;
    const warningCount = state.filtered.filter((r) => isWarning(r)).length;
    const badCount = state.filtered.filter((r) => isBad(r)).length;

    const cards = [
      {
        title: "Total Record",
        value: total,
        subtitle: "Jumlah baris KPI",
        type: "primary",
        icon: "fa-database",
      },
      {
        title: "Rata-rata Nilai",
        value: isFinite(avg) ? avg.toFixed(2) : "-",
        subtitle: "Average KPI",
        type: "accent",
        icon: "fa-gauge-high",
      },
      {
        title: "Healthy",
        value: greenCount,
        subtitle: "Status baik",
        type: "success",
        icon: "fa-circle-check",
      },
      {
        title: "Warning / Bad",
        value: `${warningCount} / ${badCount}`,
        subtitle: "Status perlu perhatian",
        type: "danger",
        icon: "fa-triangle-exclamation",
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

      card.innerHTML = `
        <div class="kpi12-card-header">
          <div>
            <div class="kpi12-card-title">${row.kategori || "-"}</div>
            <div class="kpi12-card-subtitle">${row.area || "-"}</div>
          </div>
          <div class="kpi12-card-badge">${row.status || "N/A"}</div>
        </div>
        <div class="kpi12-card-body">
          <div class="kpi12-card-metric">
            <span class="kpi12-card-metric-label">Nilai KPI</span>
            <span class="kpi12-card-metric-value">${formatNumber(
              row.nilai
            )}</span>
          </div>
          <div class="kpi12-card-bar">
            <div class="kpi12-card-bar-fill" style="width:${normalizePercent(
              row.nilai
            )}%"></div>
          </div>
        </div>
        <div class="kpi12-card-footer">
          <span class="kpi12-chip kpi12-chip-good">
            Good ≥ 90
          </span>
          <span class="kpi12-chip kpi12-chip-warning">
            Warning 70–89
          </span>
          <span class="kpi12-chip kpi12-chip-bad">
            Bad &lt; 70
          </span>
        </div>
      `;
      els.cardGrid.appendChild(card);
    });
  }

  function normalizePercent(v) {
    if (!isFinite(v)) return 0;
    if (v < 0) return 0;
    if (v > 120) return 120;
    return v;
  }

  function formatNumber(v) {
    if (!isFinite(v)) return "-";
    return v.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  }

  function isGood(r) {
    return (r.nilai || 0) >= 90;
  }

  function isWarning(r) {
    const n = r.nilai || 0;
    return n >= 70 && n < 90;
  }

  function isBad(r) {
    return (r.nilai || 0) < 70;
  }

  function getMoodClass(r) {
    if (isGood(r)) return "kpi12-card-good";
    if (isWarning(r)) return "kpi12-card-warning";
    if (isBad(r)) return "kpi12-card-bad";
    return "";
  }

  function showLoading(flag) {
    els.loading.style.display = flag ? "block" : "none";
  }

  function showError(msg) {
    els.error.classList.remove("d-none");
    if (msg) els.error.textContent = msg;
  }

  function hideError() {
    els.error.classList.add("d-none");
  }

  // Events
  els.filterSegmen.addEventListener("change", applyFilter);
  els.filterArea.addEventListener("change", applyFilter);
  els.refreshBtn.addEventListener("click", fetchData);

  // Init pertama
  fetchData();
}
