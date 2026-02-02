/* =====================================================
   INIT UNDERSPEC B2C
===================================================== */
function initUnderspecB2C(API_URL) {

  const url = API_URL + "?type=monitoring_usb2c";
  const el = document.getElementById("underspec-table");

  // Loading
  el.innerHTML = `
    <div class="text-center my-3">
      <div class="spinner-border"></div>
    </div>
  `;

  fetch(url)
    .then(r => r.json())
    .then(res => {

      if (res.error) {
        el.innerHTML = `<div class="alert alert-danger">${res.message}</div>`;
        return;
      }

      let html = `
        <table class="table table-sm table-bordered table-striped text-center align-middle">
          <thead class="table-dark">
            <tr>
              <th rowspan="2">SEKTOR</th>
              <th rowspan="2">WITEL</th>
              <th rowspan="2">HSA</th>
              <th rowspan="2">OSA</th>

              <th colspan="2">SALDO AWAL</th>
              <th colspan="5">SISA SALDO</th>

              <th rowspan="2">SWINGIN</th>
              <th rowspan="2">UNSPEC<br>BERULANG</th>
            </tr>
            <tr>
              <th>UNSPEC</th>
              <th>SPEC</th>

              <th>REGULER</th>
              <th>GOLD</th>
              <th>PLATINUM</th>
              <th>DIAMOND</th>
            </tr>
          </thead>
          <tbody>
      `;

      res.data.forEach(row => {

        const [
          sektor,          // 0
          witel,           // 1
          hsa,             // 2
          osa,             // 3
          saldoAwalUnspec, // 4
          saldoAwalSpec,   // 5
          reguler,         // 6
          gold,            // 7
          platinum,        // 8
          diamond,         // 9
          swingin,         // 10
          unspecBerulang   // 11
        ] = row;

        html += `
          <tr data-sektor="${sektor}" style="cursor:pointer;" onclick="openDetailUnderspecB2C('${API_URL}', '${sektor}', 'all')">
            <td>${sektor || "-"}</td>
            <td>${witel || "-"}</td>
            <td>${hsa || "-"}</td>
            <td>${osa || "-"}</td>

            <td class="${saldoAwalUnspec > 0 ? 'value-red' : ''}">${saldoAwalUnspec || 0}</td>
            <td class="${saldoAwalSpec > 0 ? 'value-green' : ''}">${saldoAwalSpec || 0}</td>

            <td class="${reguler > 0 ? 'value-red' : ''}">${reguler || 0}</td>
            <td class="${gold > 0 ? 'value-red' : ''}">${gold || 0}</td>
            <td class="${platinum > 0 ? 'value-red' : ''}">${platinum || 0}</td>
            <td class="${diamond > 0 ? 'value-red' : ''}">${diamond || 0}</td>

            <td class="${swingin > 0 ? 'value-red' : ''}">${swingin || 0}</td>
            <td class="${unspecBerulang > 0 ? 'value-red' : ''}">${unspecBerulang || 0}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      el.innerHTML = html;

    })
    .catch(err => {
      el.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    });
}


/* =====================================================
   MODAL DETAIL UNDERSPEC B2C
===================================================== */
function openDetailUnderspecB2C(API_URL, sektor, mode) {

  const modal = new bootstrap.Modal(
    document.getElementById('global-modal')
  );

  const modalBody  = document.querySelector('#global-modal .modal-body');
  const modalTitle = document.querySelector('#global-modal .modal-title');

  modalTitle.textContent = `Detail Underspec B2C – ${sektor} (${mode.toUpperCase()})`;

  modalBody.innerHTML = `
    <div class="text-center my-4">
      <div class="spinner-border"></div>
    </div>
  `;
  modal.show();

  fetch(
    API_URL +
    `?type=monitoring_usb2c_detail` +
    `&sektor=${encodeURIComponent(sektor)}` +
    `&mode=${mode}`
  )
    .then(r => r.json())
    .then(res => {

      const rows = res.data || [];

      if (!rows.length) {
        modalBody.innerHTML =
          `<div class="text-center text-muted py-4">Tidak ada data</div>`;
        return;
      }

      let html = `
        <div class="table-responsive">
          <table class="table table-sm table-bordered table-striped align-middle text-center">
            <thead class="table-dark">
              <tr>
                <th>SEKTOR</th>
                <th>NODE ID (NODE IP)</th>
                <th>SHELF | SLOT | PORT | ONU ID</th>
                <th>CMDF</th>
                <th>DP</th>
                <th>ND</th>
                <th>ONU RX POWER</th>
                <th>UKUR ULANG</th>
                <th>FLAG HVC</th>
              </tr>
            </thead>
            <tbody>
      `;

      rows.forEach(r => {
        html += `
          <tr>
            <td>${r.SEKTOR || '-'}</td>
            <td>${r['NODE ID(NODE IP)'] || '-'}</td>
            <td>${r['SHELF|SLOT|PORT| ONU ID'] || '-'}</td>
            <td>${r.CMDF || '-'}</td>
            <td>${r.DP || '-'}</td>
            <td>${r.ND || '-'}</td>
            <td>${r['ONU RX POWER'] || '-'}</td>
            <td>${r['UKUR ULANG'] || '-'}</td>
            <td>${r['FLAG HVC'] || '-'}</td>
          </tr>
        `;
      });

      modalBody.innerHTML = html + `
            </tbody>
          </table>
        </div>
      `;
    })
    .catch(err => {
      modalBody.innerHTML =
        `<div class="alert alert-danger">${err.message}</div>`;
    });
}
