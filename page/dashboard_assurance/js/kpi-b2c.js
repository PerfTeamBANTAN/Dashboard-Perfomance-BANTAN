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

      // Header dua baris
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
            <th colspan="3" class="text-center th-bronze">Q</th>
          </tr>
          <tr>
            <th class="text-center th-plat">LINE</th>
            <th class="text-center th-plat">GAUL</th>
            <th class="text-center th-plat">% Gaul</th>
            <th class="text-center th-bronze">LIST</th>
            <th class="text-center th-bronze">Q 30D</th>
            <th class="text-center th-bronze">% Q</th>
          </tr>
        </thead>
      `;

      const bodyRowsHtml = [];
      for (let i = 2; i < data.length; i++) {
        const r = data[i]; // A(row):L(row)
        if (!r || r.join("").toString().trim() === "") continue;

        const sto = String(r[0] ?? "").trim();
        const cluster = r[1];
        const omhas = r[2];
        const osa = r[3];
        const mitra = r[4];
        const asgarLine = r[5];
        const asgarGaul = r[6];
        const asgarPct = r[7];
        const sa = r[8];
        const qList = r[9];
        const q30 = r[10];
        const qPct = r[11];

        const gaulCount = countGaulForSto(sto);

        bodyRowsHtml.push(`
          <tr>
            <td>${sto}</td>
            <td>${cluster ?? ""}</td>
            <td>${omhas ?? ""}</td>
            <td>${osa ?? ""}</td>
            <td>${mitra ?? ""}</td>
            <td>${asgarLine ?? ""}</td>
            <td class="text-center gaul-cell" data-sto="${sto}">
              <a href="javascript:void(0)" class="text-decoration-none fw-semibold">
                ${gaulCount}
              </a>
            </td>
            <td>${asgarPct ?? ""}</td>
            <td>${sa ?? ""}</td>
            <td>${qList ?? ""}</td>
            <td>${q30 ?? ""}</td>
            <td>${qPct ?? ""}</td>
          </tr>
        `);
      }

      const tbody = `<tbody>${bodyRowsHtml.join("")}</tbody>`;

      tableRight.innerHTML = thead + tbody;

      bindGaulClickEvents();
    })
    .catch((err) => {
      console.error("Error load tabel kanan KPI B2C:", err);
      tableRight.innerHTML =
        "<tbody><tr><td>Gagal memuat data</td></tr></tbody>";
    });
}

function bindGaulClickEvents() {
  const cells = document.querySelectorAll("#kpi-b2c-table-right .gaul-cell a");
  const modalEl = document.getElementById("gaulDetailModal");
  if (!modalEl) return;

  const modalStoSpan = document.getElementById("gaulModalSto");
  const modalTableBody = document.querySelector("#gaulDetailTable tbody");

  // pastikan Bootstrap JS sudah include
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

  cells.forEach((a) => {
    a.addEventListener("click", () => {
      const sto = a.parentElement.getAttribute("data-sto");
      const details = getGaulDetailsForSto(sto);

      if (modalStoSpan) modalStoSpan.textContent = sto || "";

      if (modalTableBody) {
        modalTableBody.innerHTML = details
          .map((row) => {
            return `
              <tr>
                <td>${row[0] ?? ""}</td>  <!-- TROUBLE_NO -->
                <td>${row[1] ?? ""}</td>  <!-- TROUBLE_NUMBER -->
                <td>${row[2] ?? ""}</td>  <!-- TROUBLE_OPENTIME -->
                <td>${row[3] ?? ""}</td>  <!-- TKASSETTYPE -->
                <td>${row[4] ?? ""}</td>  <!-- FLAG_HVC -->
                <td>${row[5] ?? ""}</td>  <!-- STO -->
                <td>${row[6] ?? ""}</td>  <!-- JENIS_TIKET2 -->
                <td>${row[8] ?? ""}</td>  <!-- LETAK_PERBAIKAN -->
              </tr>
            `;
          })
          .join("");
      }

      bsModal.show();
    });
  });
}

// =========================
// QGAUL DATA
// =========================

let qGaulData = []; // simpan semua row QGAUL (tanpa header)

/**
 * Load data QGAUL!A:K sekali, simpan ke qGaulData
 */
function loadQGaulData(config) {
  const url = `${config.baseUrl}?sheet=${encodeURIComponent(
    "QGAUL"
  )}&range=${encodeURIComponent("A:K")}`;

  return fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length < 2) {
        qGaulData = [];
        return;
      }
      // data[0] = header
      qGaulData = data.slice(1);
    })
    .catch((err) => {
      console.error("Error load QGAUL:", err);
      qGaulData = [];
    });
}

/**
 * GAUL = jumlah row dengan F = STO dan J = 1
 */
function countGaulForSto(sto) {
  if (!qGaulData || qGaulData.length === 0) return 0;
  let count = 0;
  qGaulData.forEach((row) => {
    const stoVal = String(row[5] ?? "").trim();  // kolom F
    const isGaul = String(row[9] ?? "").trim();  // kolom J
    if (stoVal === sto && (isGaul === "1" || isGaul === "1,00" || isGaul === "1.00")) {
      count++;
    }
  });
  return count;
}

/**
 * Detail GAUL per STO
 */
function getGaulDetailsForSto(sto) {
  if (!qGaulData || qGaulData.length === 0) return [];
  return qGaulData.filter((row) => {
    const stoVal = String(row[5] ?? "").trim();  // F
    const isGaul = String(row[9] ?? "").trim();  // J
    return stoVal === sto && (isGaul === "1" || isGaul === "1,00" || isGaul === "1.00");
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

      // load QGAUL dulu, lalu tabel kanan
      loadQGaulData(config).then(() => {
        loadKpiB2CRightTable(config);
      });
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
