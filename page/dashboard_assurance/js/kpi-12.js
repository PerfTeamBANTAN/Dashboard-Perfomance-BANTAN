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

      const rows = await res.json();
      if (!Array.isArray(rows) || !rows.length) {
        state.raw = [];
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

  function toNumber(v) {
    if (v === null || v === undefined || v === "") return NaN;
    if (typeof v === "string") {
      const cleaned = v.replace(/\./g, "").replace(",", ".");
      const num = Number(cleaned);
      return isNaN(num) ? Number(v) : num;
    }
    return Number(v);
  }

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

  function renderSummary() {
    els.summaryRow.innerHTML = "";
    const medalEl = document.getElementById("kpi12-medal-icon");

    if (!state.filtered.length) {
      if (medalEl) medalEl.innerHTML = "";
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

    // Medal
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
        title: "Meet / Not Meet",
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

  // Medal PNG mapping
  function getMedalByTotalMeet(totalMeet) {
    if (totalMeet >= 12) {
      return {
        level: "Platinum",
        img: "assets/home/img/platinum.png",
        cssClass: "kpi12-medal-platinum",
      };
    }
    if (totalMeet >= 10) {
      return {
        level: "Gold",
        img: "assets/home/img/gold.png",
        cssClass: "kpi12-medal-gold",
      };
    }
    return {
      level: "Silver",
      img: "assets/home/img/silver.png",
      cssClass: "kpi12-medal-silver",
    };
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
  els.refreshBtn.addEventListener("click", fetchData);

  // Init
  fetchData();
}
