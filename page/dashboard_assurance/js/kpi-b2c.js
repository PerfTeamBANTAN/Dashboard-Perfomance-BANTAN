// =========================
// CONFIG
// =========================
const KPI_B2C_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbxL_isP6OTrlirRz5ySpKWxE-GTumtsJocf2TJa57MlT-yYcdSx4JJ7RtoxvO3y3SqysA/exec";

// =========================
// HELPER & RENDER FUNCTION
// =========================

// Tentukan status overall indikator:
// - Kalau HI ✅ -> ok
// - Kalau HI ❌ -> nok
// - Kalau kosong, pakai H-1
function getOverallStatus(rowObj) {
  if (rowObj.status_hi === "✅") return "ok";
  if (rowObj.status_hi === "❌") return "nok";
  if (rowObj.status_h1 === "✅") return "ok";
  if (rowObj.status_h1 === "❌") return "nok";
  return "nok";
}

// Generate HTML 1 card KPI
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
          <!-- Header indikator -->
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

          <!-- Nilai Target, H-1, HI -->
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

          <!-- Badge status kecil -->
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
// INIT & FETCH DATA
// =========================

function initKpiB2C() {
  const grid = document.getElementById("kpi-b2c-grid");
  if (!grid) return;

  // Ambil data dari Apps Script (array 2D)
  fetch(KPI_B2C_SHEET_URL)
    .then((resp) => resp.json())
    .then((data) => {
      // data = [
      //   ["Indikator","Target","H-1","Status H-1","HI","Status HI"],
      //   ["Assurance Guarantee",91.71,95.13,"✅",95.13,"✅"],
      //   ...
      // ]

      const rows = [];

      data.forEach((r, idx) => {
        // Header di index 0, skip
        if (idx === 0) return;

        const indikator = r[0];
        if (!indikator) return;

        // Skip baris KPI Branch TANGERANG kalau mau total saja ditampilkan di tempat lain
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

      // Render semua card ke grid
      grid.innerHTML = rows.map(createKpiCard).join("");
    })
    .catch((err) => {
      console.error("Error load KPI B2C:", err);
      grid.innerHTML =
        '<div class="col-12"><div class="alert alert-danger">Gagal memuat data KPI.</div></div>';
    });

  // Event filter All / OK / Not OK
  document.querySelectorAll("[data-kpi-filter]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const filter = this.getAttribute("data-kpi-filter");

      // Toggle button active
      document
        .querySelectorAll("[data-kpi-filter]")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      // Tampilkan / sembunyikan card
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

// Jalankan setelah DOM siap (atau setelah partial dimuat)
document.addEventListener("DOMContentLoaded", initKpiB2C);
