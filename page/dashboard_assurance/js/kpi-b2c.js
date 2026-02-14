// =========================
// HELPER & RENDER
// =========================

function getOverallStatus(rowObj) {
  if (rowObj.status_hi === "✅") return "ok";
  if (rowObj.status_hi === "❌") return "nok";
  if (rowObj.status_h1 === "✅") return "ok";
  if (rowObj.status_h1 === "❌") return "nok";
  return "nok";
}

function createKpiCard(rowObj) {
  const overall = getOverallStatus(rowObj);
  const overallLabel = overall === "ok" ? "On Track" : "Not Meet";

  const hiIcon = rowObj.status_hi || "";
  const h1Icon = rowObj.status_h1 || "";

  const hiBadgeClass = rowObj.status_hi === "✅" ? "kpi-pill-ok" : "kpi-pill-nok";
  const h1BadgeClass = rowObj.status_h1 === "✅" ? "kpi-pill-ok" : "kpi-pill-nok";

  return `
    <div class="col-12 col-sm-6 col-lg-4 mb-3 kpi-col" data-kpi-overall="${overall}">
      <div class="card kpi-card ${overall}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="kpi-card-title">
                ${rowObj.indikator}
              </div>
              <div class="kpi-label">
                KPI B2C • Tangerang
              </div>
            </div>
            <div class="text-end">
              <span class="${overall === "ok" ? "kpi-pill-ok" : "kpi-pill-nok"}">
                ${overallLabel}
              </span>
            </div>
          </div>

          <div class="row mb-2">
            <div class="col-4">
              <div class="kpi-label">Target</div>
              <div class="kpi-value">${rowObj.target ?? "-"}</div>
            </div>
            <div class="col-4">
              <div class="kpi-label">H-1</div>
              <div class="d-flex align-items-center gap-1">
                <span class="kpi-value me-1">${rowObj.h_1 ?? "-"}</span>
                <span class="kpi-status">${h1Icon}</span>
              </div>
            </div>
            <div class="col-4">
              <div class="kpi-label">HI</div>
              <div class="d-flex align-items-center gap-1">
                <span class="kpi-value me-1">${rowObj.hi ?? "-"}</span>
                <span class="kpi-status">${hiIcon}</span>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-between mt-1">
            <small class="${h1BadgeClass}">H-1 ${h1Icon}</small>
            <small class="${hiBadgeClass}">HI ${hiIcon}</small>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =========================
// INIT (dipanggil dari index)
// =========================

// config: { baseUrl, sheet, range }
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
          status_hi: r[5],
        });
      });

      grid.innerHTML = rows.map(createKpiCard).join("");
      initKpiFilter();
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
