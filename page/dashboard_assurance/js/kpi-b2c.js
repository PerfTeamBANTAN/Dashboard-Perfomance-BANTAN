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
// HELPER WARNA % GAUL & % Q
// =========================

function getGaulClass(value) {
  const num = parseFloat(String(value).replace(",", "."));
  if (isNaN(num)) return "";

  if (num < 91.71) return "kpi-text-red";
  if (num <= 92.50) return "kpi-text-yellow";
  return "kpi-text-green";
}

function getQClass(value) {
  const num = parseFloat(String(value).replace(",", "."));
  if (isNaN(num)) return "";

  if (num > 2.69) return "kpi-text-red";
  if (num >= 2.50) return "kpi-text-yellow";
  return "kpi-text-green";
}

// =========================
// TABLE HSA BRANCH TANGERANG ('Dash B2C'!B3:R32)
// =========================

function loadKpiB2CHsaTable(config) {
  const tableHsa = document.getElementById("kpi-b2c-table-hsa");
  if (!tableHsa) return;

  const url = `${config.baseUrl}?sheet=${encodeURIComponent(
    "Dash B2C"
  )}&range=${encodeURIComponent("B3:R32")}`;

  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length < 4) return;
      
      const thead = `
        <thead>
          <tr>
            <th rowspan="2" class="th-gold text-center">Indikator</th>
            <th rowspan="2" class="th-gold text-center">Target</th>

            <th colspan="3" class="th-plat text-center">DADY</th>
            <th colspan="3" class="th-plat text-center">EKA</th>
            <th colspan="2" class="th-plat text-center">HERLANDO</th>
            <th colspan="3" class="th-plat text-center">RISMAN</th>
            <th colspan="2" class="th-plat text-center">ZULFA</th>
            <th colspan="2" class="th-plat text-center">TANGERANG</th>
          </tr>
          <tr>
            <!-- DADY -->
            <th class="th-plat text-center">GDS</th>
            <th class="th-plat text-center">TAN</th>
            <th class="th-plat text-center">JIA</th>

            <!-- EKA -->
            <th class="th-plat text-center">CLD</th>
            <th class="th-plat text-center">PDR</th>
            <th class="th-plat text-center">PKU</th>

            <!-- HERLANDO -->
            <th class="th-plat text-center">LKG</th>
            <th class="th-plat text-center">SRP</th>

            <!-- RISMAN -->
            <th class="th-plat text-center">CPD</th>
            <th class="th-plat text-center">CKL</th>
            <th class="th-plat text-center">DTG</th>

            <!-- ZULFA -->
            <th class="th-plat text-center">SRH</th>
            <th class="th-plat text-center">CPA</th>

            <!-- TANGERANG -->
            <th class="th-plat text-center">TANGERANG</th>
            <th class="th-bronze text-center">KPI HSA</th>
          </tr>
        </thead>
      `;

      // Body: 'Dash B2C'!B5:R31 -> index 2..data.length-2
      const bodyRows = [];
      for (let i = 2; i < data.length - 1; i++) {
        const r = data[i];
        if (!r || r.join("").toString().trim() === "") continue;
        bodyRows.push(r);
      }

      // Total: 'Dash B2C'!B32:R32 -> baris terakhir (BRANCH TANGERANG, KPI HSA, dll)
      const totalRow = data[data.length - 1] || [];

      const tbody = `
  <tbody>
    ${bodyRows
      .map((r) => `
        <tr>
          <td>${r[0] ?? ""}</td>
          <td>${r[1] ?? ""}</td>

          <td>${r[2] ?? ""}</td>
          <td>${r[3] ?? ""}</td>
          <td>${r[4] ?? ""}</td>

          <td>${r[5] ?? ""}</td>
          <td>${r[6] ?? ""}</td>
          <td>${r[7] ?? ""}</td>

          <td>${r[8] ?? ""}</td>
          <td>${r[9] ?? ""}</td>

          <td>${r[10] ?? ""}</td>
          <td>${r[11] ?? ""}</td>
          <td>${r[12] ?? ""}</td>

          <td>${r[13] ?? ""}</td>
          <td>${r[14] ?? ""}</td>

          <td>${r[15] ?? ""}</td>
          <td>${r[16] ?? ""}</td>
        </tr>
      `)
      .join("")}

    <!-- ROW TOTAL KPI HSA -->
    <tr class="table-secondary fw-semibold">
      <td colspan="2">${totalRow[0] ?? ""}</td>

      <td colspan="3">${totalRow[2] ?? ""}</td>   
      <td colspan="3">${totalRow[5] ?? ""}</td>  

      <td colspan="2">${totalRow[8] ?? ""}</td> 

      <td colspan="3">${totalRow[10] ?? ""}</td>
      <td colspan="2">${totalRow[13] ?? ""}</td>
    </tr>
  </tbody>
`;

      tableHsa.innerHTML = thead + tbody;
    })
    .catch((err) => {
      console.error("Error load tabel HSA KPI B2C:", err);
      tableHsa.innerHTML =
        "<tbody><tr><td>Gagal memuat data B2C HSA.</td></tr></tbody>";
    });
}

// =========================
// TABLE MITRA BRANCH TANGERANG ('Dash B2C'!U3:AI32)
// =========================

function loadKpiB2CMitraTable(config) {
  const tableMitra = document.getElementById("kpi-b2c-table-mitra");
  if (!tableMitra) return;

  const url = `${config.baseUrl}?sheet=${encodeURIComponent(
    "Dash B2C"
  )}&range=${encodeURIComponent("U3:AI32")}`;

  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length < 4) return;

      const thead = `
        <thead>
          <tr>
            <th rowspan="2" class="th-gold text-center">Indikator</th>
            <th rowspan="2" class="th-gold text-center">Target</th>

            <th colspan="5" class="th-plat text-center">TA</th>
            <th colspan="2" class="th-plat text-center">SGN</th>
            <th colspan="1" class="th-plat text-center">SKA</th>
            <th colspan="3" class="th-plat text-center">FAMIKA</th>
            <th colspan="2" class="th-plat text-center">FSL</th>
          </tr>
          <tr>
            <th class="th-plat text-center">GDS</th>
            <th class="th-plat text-center">DTG</th>
            <th class="th-plat text-center">JIA</th>
            <th class="th-plat text-center">CLD</th>
            <th class="th-plat text-center">SRP</th>
            
            <th class="th-plat text-center">CPD</th>
            <th class="th-plat text-center">CKL</th>
            
            <th class="th-plat text-center">TAN</th>
            
            <th class="th-plat text-center">PDR</th>
            <th class="th-plat text-center">PKU</th>
            <th class="th-plat text-center">LKG</th>
            
            <th class="th-plat text-center">SRH</th>
            <th class="th-plat text-center">CPA</th>
          </tr>
        </thead>
      `;

      // Body: 'Dash B2C'!U5:AI31 -> index 2..data.length-2
      const bodyRows = [];
      for (let i = 2; i < data.length - 1; i++) {
        const r = data[i];
        if (!r || r.join("").toString().trim() === "") continue;
        bodyRows.push(r);
      }

      // Total: 'Dash B2C'!U32:AI32 -> baris terakhir
      const totalRow = data[data.length - 1] || [];

      const tbody = `
        <tbody>
          ${bodyRows
            .map((r) => `
              <tr>
                <td>${r[0] ?? ""}</td>
                <td>${r[1] ?? ""}</td>

                <td>${r[2] ?? ""}</td>
                <td>${r[3] ?? ""}</td>
                <td>${r[4] ?? ""}</td>
                <td>${r[5] ?? ""}</td>
                <td>${r[6] ?? ""}</td>

                <td>${r[7] ?? ""}</td>
                <td>${r[8] ?? ""}</td>
                <td>${r[9] ?? ""}</td>
                <td>${r[10] ?? ""}</td>
                <td>${r[11] ?? ""}</td>
                <td>${r[12] ?? ""}</td>
                <td>${r[13] ?? ""}</td>
                <td>${r[14] ?? ""}</td>
              </tr>
            `)
            .join("")}

    <!-- ROW TOTAL KPI HSA -->
    <tr class="table-secondary fw-semibold">
      <td colspan="2">${totalRow[0] ?? ""}</td>

      <td colspan="5">${totalRow[2] ?? ""}</td>   
      <td colspan="2">${totalRow[7] ?? ""}</td>  

      <td colspan="1">${totalRow[9] ?? ""}</td> 

      <td colspan="3">${totalRow[10] ?? ""}</td>
      <td colspan="2">${totalRow[13] ?? ""}</td>
    </tr>
  </tbody>
`;

      tableMitra.innerHTML = thead + tbody;
    })
    .catch((err) => {
      console.error("Error load tabel MITRA KPI B2C:", err);
      tableMitra.innerHTML =
        "<tbody><tr><td>Gagal memuat data B2C MITRA.</td></tr></tbody>";
    });
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

      const bodyRows = [];
      for (let i = 2; i < data.length - 1; i++) {
        const r = data[i];
        if (!r || r.join("").toString().trim() === "") continue;
        bodyRows.push(r);
      }
      const totalRow = data[data.length - 1] || [];

      const tbody = `
        <tbody>
          ${bodyRows
            .map((r) => {
              const sto = r[0];
              const cluster = r[1];
              const omHas = r[2];
              const osa = r[3];
              const mitra = r[4];
              const asgarLine = r[5];
              const asgarGaul = r[6];
              const gaulPercent = r[7];
              const serviceAvail = r[8];
              const qList = r[9];
              const q30d = r[10];
              const qPercent = r[11];

              const gaulClass = getGaulClass(gaulPercent);
              const qClass = getQClass(qPercent);

              return `
                <tr>
                  <td>${sto ?? ""}</td>
                  <td>${cluster ?? ""}</td>
                  <td>${omHas ?? ""}</td>
                  <td>${osa ?? ""}</td>
                  <td>${mitra ?? ""}</td>
                  <td>${asgarLine ?? ""}</td>
                  <td>${asgarGaul ?? ""}</td>
                  <td class="${gaulClass}">${gaulPercent ?? ""}</td>
                  <td>${serviceAvail ?? ""}</td>
                  <td>${qList ?? ""}</td>
                  <td>${q30d ?? ""}</td>
                  <td class="${qClass}">${qPercent ?? ""}</td>
                </tr>
              `;
            })
            .join("")}

          <tr class="table-secondary fw-semibold">
            <td colspan="5">${totalRow[0] ?? ""}</td>
            <td>${totalRow[5] ?? ""}</td>
            <td>${totalRow[6] ?? ""}</td>
            <td>${totalRow[7] ?? ""}</td>
            <td>${totalRow[8] ?? ""}</td>
            <td>${totalRow[9] ?? ""}</td>
            <td>${totalRow[10] ?? ""}</td>
            <td>${totalRow[11] ?? ""}</td>
          </tr>
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


function loadKpiB2CPrimaryTable(config) {
  const tablePrimary = document.getElementById("kpi-b2c-table-primary");
  if (!tablePrimary) return;

  const url = `${config.baseUrl}?sheet=${encodeURIComponent(
    config.sheet
  )}&range=${encodeURIComponent("WEB!A50:T65")}`;

  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length < 3) return;

      const thead = `
        <thead>
          <tr>
            <th rowspan="2" class="th-gold">STO</th>
            <th rowspan="2" class="th-gold">Telkomsel Cluster</th>
            <th rowspan="2" class="th-gold">OM HAS</th>
            <th rowspan="2" class="th-gold">OSA</th>
            <th rowspan="2" class="th-gold">MITRA</th>

            <th colspan="3" class="text-center th-plat">TTR36H (Non HVC)</th>
            <th colspan="3" class="text-center th-plat">TTR3H (D,V)</th>
            <th colspan="3" class="text-center th-plat">TTR3H (MANJA)</th>
            <th colspan="3" class="text-center th-plat">TTR6H (P)</th>
            <th colspan="3" class="text-center th-plat">TTR12H (G)</th>
          </tr>
          <tr>
            <th class="text-center th-bronze">NOT COMP</th>
            <th class="text-center th-plat">COMPLY</th>
            <th class="text-center th-plat">% TTR36H</th>

            <th class="text-center th-bronze">NOT COMP</th>
            <th class="text-center th-plat">COMPLY</th>
            <th class="text-center th-plat">% TTR3H (D,V)</th>

            <th class="text-center th-bronze">NOT COMP</th>
            <th class="text-center th-plat">COMPLY</th>
            <th class="text-center th-plat">% TTR3H (MANJA)</th>

            <th class="text-center th-bronze">NOT COMP</th>
            <th class="text-center th-plat">COMPLY</th>
            <th class="text-center th-plat">% TTR6H (P)</th>

            <th class="text-center th-bronze">NOT COMP</th>
            <th class="text-center th-plat">COMPLY</th>
            <th class="text-center th-plat">% TTR12H (G)</th>
          </tr>
        </thead>
      `;

      const bodyRows = [];
      for (let i = 2; i < data.length - 1; i++) {
        const r = data[i];
        if (!r || r.join("").toString().trim() === "") continue;
        bodyRows.push(r);
      }

      const totalRow = data[data.length - 1] || [];

      const tbody = `
        <tbody>
          ${bodyRows
            .map((r) => `
              <tr>
                <td>${r[0] ?? ""}</td>   <!-- STO -->
                <td>${r[1] ?? ""}</td>   <!-- Cluster -->
                <td>${r[2] ?? ""}</td>   <!-- OM HAS -->
                <td>${r[3] ?? ""}</td>   <!-- OSA -->
                <td>${r[4] ?? ""}</td>   <!-- MITRA -->

                <td>${r[5]  ?? ""}</td>  <!-- TTR36H NOT COMP -->
                <td>${r[6]  ?? ""}</td>  <!-- TTR36H COMPLY -->
                <td>${r[7]  ?? ""}</td>  <!-- % TTR36H -->

                <td>${r[8]  ?? ""}</td>  <!-- TTR3H D,V NOT COMP -->
                <td>${r[9]  ?? ""}</td>  <!-- TTR3H D,V COMPLY -->
                <td>${r[10] ?? ""}</td>  <!-- % TTR3H D,V -->

                <td>${r[11] ?? ""}</td>  <!-- TTR3H MANJA NOT COMP -->
                <td>${r[12] ?? ""}</td>  <!-- TTR3H MANJA COMPLY -->
                <td>${r[13] ?? ""}</td>  <!-- % TTR3H MANJA -->

                <td>${r[14] ?? ""}</td>  <!-- TTR6H P NOT COMP -->
                <td>${r[15] ?? ""}</td>  <!-- TTR6H P COMPLY -->
                <td>${r[16] ?? ""}</td>  <!-- % TTR6H P -->

                <td>${r[17] ?? ""}</td>  <!-- TTR12H G NOT COMP -->
                <td>${r[18] ?? ""}</td>  <!-- TTR12H G COMPLY -->
                <td>${r[19] ?? ""}</td>  <!-- % TTR12H G -->
              </tr>
            `)
            .join("")}

    <!-- ROW TOTAL: TANGERANG -->
    <tr class="table-secondary fw-semibold">
      <td colspan="5">${totalRow[0] ?? ""}</td>
      <td>${totalRow[5] ?? ""}</td>
      <td>${totalRow[6] ?? ""}</td>
      <td>${totalRow[7] ?? ""}</td>
      <td>${totalRow[8] ?? ""}</td>
      <td>${totalRow[9] ?? ""}</td>
      <td>${totalRow[10] ?? ""}</td>
    </tr>
  </tbody>
`;

      tablePrimary.innerHTML = thead + tbody;
    })
    .catch((err) => {
      console.error("Error load tabel Primary KPI B2C:", err);
      tablePrimary.innerHTML =
        "<tbody><tr><td>Gagal memuat data Primary KPI.</td></tr></tbody>";
    });
}

// =========================
// TABLE MAJOR KPI (WEB!A110:K125)
// =========================

function loadKpiB2CMajorTable(config) {
  const tableMajor = document.getElementById("kpi-b2c-table-major");
  if (!tableMajor) return;

  const url = `${config.baseUrl}?sheet=${encodeURIComponent(
    config.sheet
  )}&range=${encodeURIComponent("WEB!A110:K125")}`;

  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length < 3) return;

      // Header 2 baris: WEB!A110:K111
      const thead = `
        <thead>
          <tr>
            <th rowspan="2" class="th-gold">STO</th>
            <th rowspan="2" class="th-gold">Telkomsel Cluster</th>
            <th rowspan="2" class="th-gold">OM HAS</th>
            <th rowspan="2" class="th-gold">OSA</th>
            <th rowspan="2" class="th-gold">MITRA</th>

            <th colspan="2" class="text-center th-plat">
              TTR Comply SQM 4H<br>
              <span class="small">(Exclude tiket diluar Jam Kerja)</span>
            </th>

            <th colspan="2" class="text-center th-plat">Underspec Non Warranty</th>
            <th colspan="2" class="text-center th-plat">Closed SQM</th>
          </tr>
          <tr>
            <th class="text-center th-plat">% TTR</th>
            <th class="text-center th-plat">COMPLY</th>

            <th class="text-center th-bronze">SCC-INET</th>
            <th class="text-center th-plat">COMPLY</th>

            <th class="text-center th-bronze">NOT COMPLY</th>
            <th class="text-center th-plat">COMPLY</th>
          </tr>
        </thead>
      `;

      // Body: WEB!A112:K124 -> index 2 s/d data.length-2
      const bodyRows = [];
      for (let i = 2; i < data.length - 1; i++) {
        const r = data[i];
        if (!r || r.join("").toString().trim() === "") continue;
        bodyRows.push(r);
      }

      // Total: WEB!A125:K125 -> baris terakhir
      const totalRow = data[data.length - 1] || [];

      const tbody = `
  <tbody>
    ${bodyRows
      .map((r) => `
        <tr>
          <td>${r[0] ?? ""}</td>  <!-- STO -->
          <td>${r[1] ?? ""}</td>  <!-- Cluster -->
          <td>${r[2] ?? ""}</td>  <!-- OM HAS -->
          <td>${r[3] ?? ""}</td>  <!-- OSA -->
          <td>${r[4] ?? ""}</td>  <!-- MITRA -->

          <td>${r[5] ?? ""}</td>  <!-- TTR value -->
          <td>${r[6] ?? ""}</td>  <!-- % TTR -->

          <td>${r[7] ?? ""}</td>  <!-- Underspec (SCC-INET) -->
          <td>${r[8] ?? ""}</td>  <!-- Underspec COMPLY -->

          <td>${r[9]  ?? ""}</td> <!-- Closed SQM NOT COMPLY -->
          <td>${r[10] ?? ""}</td> <!-- Closed SQM COMPLY -->
        </tr>
      `)
      .join("")}

    <!-- ROW TOTAL: TANGERANG -->
    <tr class="table-secondary fw-semibold">
      <td colspan="5">${totalRow[0] ?? ""}</td>
      <td>${totalRow[5] ?? ""}</td>
      <td>${totalRow[6] ?? ""}</td>
      <td>${totalRow[7] ?? ""}</td>
      <td>${totalRow[8] ?? ""}</td>
      <td>${totalRow[9] ?? ""}</td>
      <td>${totalRow[10] ?? ""}</td>
    </tr>
  </tbody>
`;

      tableMajor.innerHTML = thead + tbody;
    })
    .catch((err) => {
      console.error("Error load tabel Major KPI B2C:", err);
      tableMajor.innerHTML =
        "<tbody><tr><td>Gagal memuat data Major KPI.</td></tr></tbody>";
    });
}

// =========================
// TABLE CORE KPI (WEB!A70:K85)
// =========================

function loadKpiB2CCoreTable(config) {
  const tableCore = document.getElementById("kpi-b2c-table-core");
  if (!tableCore) return;

  const url = `${config.baseUrl}?sheet=${encodeURIComponent(
    config.sheet
  )}&range=${encodeURIComponent("WEB!A70:K85")}`;

  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length < 4) return;

      // Header 2 baris: WEB!A70:K71
      const thead = `
        <thead>
          <tr>
            <th rowspan="2" class="th-gold">STO</th>
            <th rowspan="2" class="th-gold">Telkomsel Cluster</th>
            <th rowspan="2" class="th-gold">OM HAS</th>
            <th rowspan="2" class="th-gold">SEKTOR</th>

            <th colspan="2" class="text-center th-plat">Target</th>
            <th colspan="4" class="text-center th-plat">Tangible</th>
            <th colspan="2" class="text-center th-bronze">Dismantling ex CT0</th>
          </tr>
          <tr>
            <th class="text-center th-plat">Target ODP</th>
            <th class="text-center th-plat">Target ODC</th>

            <th class="text-center th-plat">ODP (Quantity)</th>
            <th class="text-center th-plat">ODP (%)</th>
            <th class="text-center th-plat">ODC (Quantity)</th>
            <th class="text-center th-plat">ODC (%)</th>

            <th class="text-center th-bronze">%</th>
          </tr>
        </thead>
      `;

      // Body: WEB!A72:K84 -> index 2..data.length-2
      const bodyRows = [];
      for (let i = 2; i < data.length - 1; i++) {
        const r = data[i];
        if (!r || r.join("").toString().trim() === "") continue;
        bodyRows.push(r);
      }

      // Total: WEB!A85 -> baris terakhir ("BRANCH TANGERANG", dst)
      const totalRow = data[data.length - 1] || [];

      const tbody = `
        <tbody>
          ${bodyRows
            .map((r) => `
              <tr>
                <td>${r[0] ?? ""}</td>  <!-- STO -->
                <td>${r[1] ?? ""}</td>  <!-- Cluster -->
                <td>${r[2] ?? ""}</td>  <!-- OM HAS -->
                <td>${r[3] ?? ""}</td>  <!-- SEKTOR -->

                <td>${r[4] ?? ""}</td>  <!-- Target ODP -->
                <td>${r[5] ?? ""}</td>  <!-- Target ODC -->

                <td>${r[6] ?? ""}</td>  <!-- Tangible ODP (Qty) -->
                <td>${r[7] ?? ""}</td>  <!-- Tangible ODP (Qual/%) -->
                <td>${r[8] ?? ""}</td>  <!-- Tangible ODC (Qty) -->
                <td>${r[9] ?? ""}</td>  <!-- Tangible ODC (Qual/%) -->

                <td>${r[10] ?? ""}</td> <!-- Dismantling ex CT0 (Qty / %) -->
              </tr>
            `)
            .join("")}

          <tr class="table-secondary fw-semibold">
            <td colspan="4">${totalRow[0] ?? ""}</td>
            <td>${totalRow[4] ?? ""}</td>
            <td>${totalRow[5] ?? ""}</td>
            <td>${totalRow[6] ?? ""}</td>
            <td>${totalRow[7] ?? ""}</td>
            <td>${totalRow[8] ?? ""}</td>
            <td>${totalRow[9] ?? ""}</td>
            <td>${totalRow[10] ?? ""}</td>
          </tr>
        </tbody>
      `;

      tableCore.innerHTML = thead + tbody;
    })
    .catch((err) => {
      console.error("Error load tabel Core KPI B2C:", err);
      tableCore.innerHTML =
        "<tbody><tr><td>Gagal memuat data Core KPI.</td></tr></tbody>";
    });
}

// =========================
// TABLE SUPPORT KPI (WEB!A90:J104)
// =========================

function loadKpiB2CSupportTable(config) {
  const tableSupport = document.getElementById("kpi-b2c-table-support");
  if (!tableSupport) return;

  const url = `${config.baseUrl}?sheet=${encodeURIComponent(
    config.sheet
  )}&range=${encodeURIComponent("WEB!A90:J104")}`;

  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length < 3) return;

      // Header: WEB!A90:J90
      const thead = `
        <thead>
          <tr>
            <th class="th-gold">STO</th>
            <th class="th-gold">Telkomsel Cluster</th>
            <th class="th-gold">OM HAS</th>
            <th class="th-gold">OSA</th>
            <th class="th-gold">MITRA</th>
            <th class="th-plat text-center">VALINS DC QR code &amp; Service</th>
            <th class="th-plat text-center">VALINS Visit ODP</th>
            <th class="th-plat text-center">Validasi ODC</th>
            <th class="th-plat text-center">Validasi Connect ODP-OLT</th>
            <th class="th-plat text-center">Validasi Tiang</th>
          </tr>
        </thead>
      `;

      // Body: WEB!A91:J103 -> index 1..data.length-2
      const bodyRows = [];
      for (let i = 1; i < data.length - 1; i++) {
        const r = data[i];
        if (!r || r.join("").toString().trim() === "") continue;
        bodyRows.push(r);
      }

      // Total: WEB!A104:J104 -> baris terakhir (BRANCH TANGERANG)
      const totalRow = data[data.length - 1] || [];

      const tbody = `
        <tbody>
          ${bodyRows
            .map((r) => `
              <tr>
                <td>${r[0] ?? ""}</td>  <!-- STO -->
                <td>${r[1] ?? ""}</td>  <!-- Cluster -->
                <td>${r[2] ?? ""}</td>  <!-- OM HAS -->
                <td>${r[3] ?? ""}</td>  <!-- OSA -->
                <td>${r[4] ?? ""}</td>  <!-- MITRA -->

                <td>${r[5] ?? ""}</td>  <!-- VALINS DC QR & Service -->
                <td>${r[6] ?? ""}</td>  <!-- VALINS Visit ODP -->
                <td>${r[7] ?? ""}</td>  <!-- Validasi ODC -->
                <td>${r[8] ?? ""}</td>  <!-- Validasi Connect ODP-OLT -->
                <td>${r[9] ?? ""}</td>  <!-- Validasi Tiang -->
              </tr>
            `)
            .join("")}

          <tr class="table-secondary fw-semibold">
            <td colspan="5">${totalRow[0] ?? ""}</td>
            <td>${totalRow[5] ?? ""}</td>
            <td>${totalRow[6] ?? ""}</td>
            <td>${totalRow[7] ?? ""}</td>
            <td>${totalRow[8] ?? ""}</td>
            <td>${totalRow[9] ?? ""}</td>
          </tr>
        </tbody>
      `;

      tableSupport.innerHTML = thead + tbody;
    })
    .catch((err) => {
      console.error("Error load tabel Support KPI B2C:", err);
      tableSupport.innerHTML =
        "<tbody><tr><td>Gagal memuat data Support KPI.</td></tr></tbody>";
    });
}

// =========================
// RANKING TOP 5 (WEB!A130:B135) + AVATAR PNG
// =========================

function loadKpiB2CRanking(config) {
  const rankTitle1 = document.getElementById("rank-title-1");
  const rankTitle2 = document.getElementById("rank-title-2");
  const rankScore1 = document.getElementById("rank-score-1");
  const rankScore2 = document.getElementById("rank-score-2");
  const rankDesc1  = document.getElementById("rank-desc-1");
  const rankDesc2  = document.getElementById("rank-desc-2");

  const rankItem3  = document.getElementById("rank-item-3");
  const rankItem4  = document.getElementById("rank-item-4");
  const rankItem5  = document.getElementById("rank-item-5");

  const img1 = document.getElementById("rank-img-1");
  const img2 = document.getElementById("rank-img-2");
  const img3 = document.getElementById("rank-img-3");
  const img4 = document.getElementById("rank-img-4");
  const img5 = document.getElementById("rank-img-5");

  if (
    !rankTitle1 || !rankTitle2 ||
    !rankScore1 || !rankScore2 ||
    !rankItem3 || !rankItem4 || !rankItem5 ||
    !img1 || !img2 || !img3 || !img4 || !img5
  ) {
    return;
  }

  const url = `${config.baseUrl}?sheet=${encodeURIComponent(
    "WEB"
  )}&range=${encodeURIComponent("A130:B135")}`;

  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length < 2) return;

      const rows = [];
      data.forEach((r, idx) => {
        if (idx === 0) return; 
        if (!r || r.join("").toString().trim() === "") return;
        rows.push({
          rank: r[0],   
          nama: r[1]    
        });
      });

      if (rows.length < 5) return;

      function getSlugFromNama(nama) {
        if (!nama) return "";
        const n = String(nama).toLowerCase().trim();
        if (n.includes("zulfa")) return "zulfa";
        if (n.includes("risman")) return "risman";
        if (n.includes("herlando")) return "herlando";
        if (n.includes("dady") || n.includes("dadi")) return "dadi";
        if (n.includes("eka")) return "eka";
        return n.split(/\s+/)[0];
      }

      const basePath = "../../assets/home/img";

      function setImgWithFallback(imgEl, slug, type) {
        const src = `${basePath}/${slug}_${type}.png`;
        imgEl.onerror = null;
        imgEl.src = src;
        imgEl.onerror = function () {
          this.onerror = null;
          this.src = `${basePath}/default_avatar.png`;
        };
      }

      // Rank 1 (ZULFA)
      const r1 = rows[0];
      const slug1 = getSlugFromNama(r1.nama);
      rankTitle1.textContent = r1.rank || "1";     // angka rank
      rankScore1.textContent = r1.nama || "-";     // nama yang ditampilkan
      rankDesc1.textContent =
        "Performa terbaik, jadi role model utama pencapaian KPI B2C Tangerang.";
      setImgWithFallback(img1, slug1, "juara");

      // Rank 2 (RISMAN)
      const r2 = rows[1];
      const slug2 = getSlugFromNama(r2.nama);
      rankTitle2.textContent = r2.rank || "2";
      rankScore2.textContent = r2.nama || "-";
      rankDesc2.textContent =
        "Konsisten di papan atas dan sangat berkontribusi pada total performa.";
      setImgWithFallback(img2, slug2, "juara");

      // Rank 3–5 (HERLANDO, DADY, EKA)
      const rankRows345 = [rows[2], rows[3], rows[4]];
      const liElems  = [rankItem3, rankItem4, rankItem5];
      const imgElems = [img3, img4, img5];

      rankRows345.forEach((item, idx) => {
        const li = liElems[idx];
        const titleSpan = li.querySelector(".rank-title");
        const scoreSpan = li.querySelector(".rank-score");
        const slug = getSlugFromNama(item.nama);

        // titleSpan = angka rank (3/4/5), scoreSpan = nama
        if (titleSpan) titleSpan.textContent = item.rank || String(idx + 3);
        if (scoreSpan) scoreSpan.textContent = item.nama || "-";
        setImgWithFallback(imgElems[idx], slug, "kalah");
      });
    })
    .catch((err) => {
      console.error("Error load ranking KPI B2C:", err);
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
      loadKpiB2CHsaTable(config);
      loadKpiB2CMitraTable(config);
      loadKpiB2CRanking(config);
      loadKpiB2CRightTable(config);
      loadKpiB2CPrimaryTable(config);
      loadKpiB2CMajorTable(config);
      loadKpiB2CCoreTable(config); 
      loadKpiB2CSupportTable(config);
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
