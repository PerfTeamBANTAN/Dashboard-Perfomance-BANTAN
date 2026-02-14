// =========================
// HELPER STATUS & GROWTH
// =========================

function getOverallStatus(rowObj) {
  if (rowObj.status_hi === "✅") return "ok";
  if (rowObj.status_hi === "❌") return "nok";
  if (rowObj.status_h1 === "✅") return "ok";
  if (rowObj.status_h1 === "❌") return "nok";
  return "nok";
}

function getGrowthInfo(rowObj) {
  const hi = parseFloat(String(rowObj.hi).replace(",", "."));
  const h1 = parseFloat(String(rowObj.h_1).replace(",", "."));

  if (isNaN(hi) || isNaN(h1)) {
    return { icon: "minus", cls: "growth-flat", title: "No data" };
  }

  if (hi > h1) {
    return { icon: "arrow-up", cls: "growth-up", title: "HI lebih baik dari H-1" };
  } else if (hi < h1) {
    return { icon: "arrow-down", cls: "growth-down", title: "HI lebih buruk dari H-1" };
  } else {
    return { icon: "minus", cls: "growth-flat", title: "HI sama dengan H-1" };
  }
}

// =========================
// CARD KPI
// =========================

function createKpiCard(rowObj) {
  const overall = getOverallStatus(rowObj);
  const overallLabel = overall === "ok" ? "On Track" : "Not Meet";

  const hiIcon = rowObj.status_hi || "";
  const h1Icon = rowObj.status_h1 || "";

  const hiBadgeClass = rowObj.status_hi === "✅" ? "kpi-pill-ok" : "kpi-pill-nok";
  const h1BadgeClass = rowObj.status_h1 === "✅" ? "kpi-pill-ok" : "kpi-pill-nok";

  const growth = getGrowthInfo(rowObj);

  return `
    <div class="col-12 col-sm-4 col-md-3 col-lg-2 mb-1 kpi-col" data-kpi-overall="${overall}">
      <div class="card kpi-card ${overall}">
        <div class="card-body">
          <!-- header -->
          <div class="d-flex justify-content-between align-items-start mb-1">
            <div>
              <div class="kpi-card-title">${rowObj.indikator}</div>
              <div class="kpi-label">KPI B2C • Tangerang</div>
            </div>
            <span class="${overall === "ok" ? "kpi-pill-ok" : "kpi-pill-nok"}">
              ${overallLabel}
            </span>
          </div>

          <!-- content utama: Target / H-1 / Growth / HI -->
          <div class="d-flex align-items-center mt-1">
            <!-- sisi kiri: target & H-1 -->
            <div class="flex-grow-1">
              <div class="d-flex">
                <div class="me-3">
                  <div class="kpi-label">Target</div>
                  <div class="kpi-value">${rowObj.target ?? "-"}</div>
                </div>
                <div>
                  <div class="kpi-label">H-1</div>
                  <div class="d-flex align-items-center">
                    <span class="kpi-value me-1">${rowObj.h_1 ?? "-"}</span>
                    <span class="kpi-status">${h1Icon}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- tengah: growth box -->
            <div class="mx-3">
              <div class="kpi-growth-box" title="${growth.title}">
                <i class="fa-solid fa-${growth.icon} ${growth.cls}"></i>
              </div>
            </div>

            <!-- kanan: HI -->
            <div class="text-end">
              <div class="kpi-label">HI</div>
              <div class="d-flex align-items-center justify-content-end">
                <span class="kpi-value me-1">${rowObj.hi ?? "-"}</span>
                <span class="kpi-status">${hiIcon}</span>
              </div>
            </div>
          </div>

          <!-- footer kecil -->
          <div class="d-flex justify-content-between align-items-center mt-2">
            <span class="${h1BadgeClass} kpi-mini">H-1 ${h1Icon || ""}</span>
            <span class="${hiBadgeClass} kpi-mini">HI ${hiIcon || ""}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =========================
// TABLE KANAN (REKAP TANGERANG)
// =========================

// header 1 baris, sesuai struktur yang disederhanakan
function buildRightTableHeader() {
  const cols = [
    "STO",
    "Telkomsel Cluster",
    "OM HAS",
    "OSA",
    "MITRA",
    "Asgar LINE",
    "Asgar GAUL",
    "Asgar %",
    "Service Availability",
    "Q LIST",
    "Q %",
    "LINE",
    "GAUL",
    "LIST",
    "Q 30D"
  ];

  return `
    <thead>
      <tr>
        ${cols.map((c) => `<th scope="col">${c}</th>`).join("")}
      </tr>
    </thead>
  `;
}

function buildTableBody(rows) {
  return `
    <tbody>
      ${rows
        .map(
          (r) => `
        <tr>
          ${r.map((cell) => `<td>${cell ?? ""}</td>`).join("")}
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;
}

function loadKpiB2CRightTable(config) {
  const tableRight = document.getElementById("kpi-b2c-table-right");
  if (!tableRight) return;

  const url = `${config.baseUrl}?sheet=${encodeURIComponent(
    config.sheet
  )}&range=${encodeURIComponent("A30:L45")}`;

  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length < 4) return;

      const row30 = data[0]; // A30:L30
      const row31 = data[1]; // A31:L31

      // Header dua baris yang “bagus”, manual sesuai struktur merge:
      const thead = `
  <thead>
    <tr>
      <th rowspan="2" class="th-gold">STO</th>
      <th rowspan="2" class="th-gold">Telkomsel Cluster</th>
      <th rowspan="2" class="th-gold">OM HAS</th>
      <th rowspan="2" class="th-gold">OSA</th>
      <th rowspan="2" class="th-gold">MITRA</th>
      <th colspan="3" class="text-center th-plat">Asgar</th>
      <th rowspan="2" class="text-center th-silver">Service Availability</th>
      <th colspan="2" class="text-center th-bronze">Q</th>
    </tr>
    <tr>
      <th class="text-center th-plat">LINE</th>
      <th class="text-center th-plat">GAUL</th>
      <th class="text-center th-plat">% Gaul</th>
      <th class="text-center th-bronze">LIST</th>
      <th class="text-center th-bronze">% Q30D</th>
    </tr>
  </thead>
`;

      // Data body: STO (A32:L44) + total (A45:L45)
      const bodyRows = [];
      for (let i = 2; i < data.length; i++) {
        const r = data[i];

        // map ke urutan header:
        // STO, Cluster, OM HAS, OSA, MITRA,
        // Asgar LINE(F), Asgar GAUL(G), Asgar %(H),
        // SA(I), Q LIST(J), Q %(K),
        // LINE(F), GAUL(G), LIST(J), Q 30D(K)
        bodyRows.push([
          r[0],   // STO
          r[1],   // Cluster
          r[2],   // OM HAS
          r[3],   // OSA
          r[4],   // MITRA
          r[5],   // Asgar LINE
          r[6],   // Asgar GAUL
          r[7],   // Asgar %
          r[8],   // Service Availability
          r[9],   // Q LIST
          r[10],  // Q %
          r[11]   // LINE
        ]);
      }

      const tbody = `
        <tbody>
          ${bodyRows
            .map(
              (r) => `
            <tr>
              ${r.map((v) => `<td>${v ?? ""}</td>`).join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      `;

      tableRight.innerHTML = thead + tbody;
    })
    .catch((err) => {
      console.error("Error load tabel kanan KPI B2C:", err);
      tableRight.innerHTML =
        "<tbody><tr><td>Gagal memuat data</td></tr></tbody>";
    });
}

// =========================
// INIT & FILTER
// =========================

function initKPIB2C(config) {
  const grid = document.getElementById("kpi-b2c-grid");
  if (!grid) return;

  const url = `${config.baseUrl}?sheet=${encodeURIComponent(
    config.sheet
  )}&range=${encodeURIComponent(config.range)}`;

  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      const rows = [];

      data.forEach((r, idx) => {
        if (idx === 0) return; // header
        const indikator = r[0];
        if (!indikator) return;

        if (String(indikator).toLowerCase().includes("kpi branch tangerang")) {
          return;
        }

        rows.push({
          indikator: indikator,
          target: r[1],
          h_1: r[2],
          status_h1: r[3],
          hi: r[4],
          status_hi: r[5]
        });
      });

      grid.innerHTML = rows.map(createKpiCard).join("");
      initKpiFilter();

      // load tabel kanan setelah card selesai
      loadKpiB2CRightTable(config);
    })
    .catch((err) => {
      console.error("Error load KPI B2C:", err);
      grid.innerHTML =
        '<div class="col-12"><div class="alert alert-danger">Gagal memuat data KPI.</div></div>';
    });
}

function initKpiFilter() {
  document.querySelectorAll("[data-kpi-filter]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const filter = this.getAttribute("data-kpi-filter");

      document
        .querySelectorAll("[data-kpi-filter]")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      document
        .querySelectorAll("#kpi-b2c-grid .kpi-col")
        .forEach((col) => {
          const overall = col.getAttribute("data-kpi-overall");

          if (filter === "all") {
            col.style.display = "";
          } else if (filter === "ok" && overall === "ok") {
            col.style.display = "";
          } else if (filter === "nok" && overall === "nok") {
            col.style.display = "";
          } else {
            col.style.display = "none";
          }
        });
    });
  });
}

window.initKPIB2C = initKPIB2C;
