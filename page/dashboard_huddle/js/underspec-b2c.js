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
              <th colspan="4">SISA SALDO</th>

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

      // Inisialisasi total
      let total = {
        saldoAwalUnspec: 0,
        saldoAwalSpec: 0,
        reguler: 0,
        gold: 0,
        platinum: 0,
        diamond: 0,
        swingin: 0,
        unspecBerulang: 0
      };

      res.data.forEach(row => {
        const [
          sektor, witel, hsa, osa,
          saldoAwalUnspec, saldoAwalSpec,
          reguler, gold, platinum, diamond,
          swingin, unspecBerulang
        ] = row;

        // Tambahkan ke total
        total.saldoAwalUnspec += saldoAwalUnspec || 0;
        total.saldoAwalSpec   += saldoAwalSpec || 0;
        total.reguler         += reguler || 0;
        total.gold            += gold || 0;
        total.platinum        += platinum || 0;
        total.diamond         += diamond || 0;
        total.swingin         += swingin || 0;
        total.unspecBerulang  += unspecBerulang || 0;

        // Buat row per sektor
        html += `
          <tr>
            <td>${sektor || "-"}</td>
            <td>${witel || "-"}</td>
            <td>${hsa || "-"}</td>
            <td>${osa || "-"}</td>

            <td class="${saldoAwalUnspec>0?'value-red':''}" 
                style="cursor:pointer;"
                onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','unspec')">
              ${saldoAwalUnspec||0}
            </td>

            <td class="${saldoAwalSpec>0?'value-green':''}" 
                style="cursor:pointer;"
                onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','spec')">
              ${saldoAwalSpec||0}
            </td>

            <td class="${reguler>0?'value-red':''}" 
                style="cursor:pointer;"
                onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','reguler')">
              ${reguler||0}
            </td>

            <td class="${gold>0?'value-red':''}" 
                style="cursor:pointer;"
                onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','gold')">
              ${gold||0}
            </td>

            <td class="${platinum>0?'value-red':''}" 
                style="cursor:pointer;"
                onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','platinum')">
              ${platinum||0}
            </td>

            <td class="${diamond>0?'value-red':''}" 
                style="cursor:pointer;"
                onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','diamond')">
              ${diamond||0}
            </td>

            <td class="${swingin>0?'value-red':''}" 
                style="cursor:pointer;"
                onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','swingin')">
              ${swingin||0}
            </td>

            <td class="${unspecBerulang>0?'value-red':''}" 
                style="cursor:pointer;"
                onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','berulang')">
              ${unspecBerulang||0}
            </td>
          </tr>
        `;
      });

      // Row Total
      html += `
        <tr class="table-dark fw-bold">
          <td colspan="4" class="text-end">TOTAL</td>
          <td style="cursor:pointer;" onclick="openDetailUnderspecB2C('${API_URL}','ALL','unspec')">${total.saldoAwalUnspec}</td>
          <td style="cursor:pointer;" onclick="openDetailUnderspecB2C('${API_URL}','ALL','spec')">${total.saldoAwalSpec}</td>
          <td style="cursor:pointer;" onclick="openDetailUnderspecB2C('${API_URL}','ALL','reguler')">${total.reguler}</td>
          <td style="cursor:pointer;" onclick="openDetailUnderspecB2C('${API_URL}','ALL','gold')">${total.gold}</td>
          <td style="cursor:pointer;" onclick="openDetailUnderspecB2C('${API_URL}','ALL','platinum')">${total.platinum}</td>
          <td style="cursor:pointer;" onclick="openDetailUnderspecB2C('${API_URL}','ALL','diamond')">${total.diamond}</td>
          <td style="cursor:pointer;" onclick="openDetailUnderspecB2C('${API_URL}','ALL','swingin')">${total.swingin}</td>
          <td style="cursor:pointer;" onclick="openDetailUnderspecB2C('${API_URL}','ALL','berulang')">${total.unspecBerulang}</td>
        </tr>
      `;

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

/* =====================================================
   DETAIL TOTAL UNDERSPEC B2C (ALL SEKTOR)
===================================================== */
function openTotalDetailUnderspecB2C(colIndex) {

  const f = window.B2C_ACTIVE_FILTER || {}; // filter opsional, misal STO/WITEL/HSA

  const params = { type: 'monitoring_usb2c_total_detail' };

  // Kirim filter jika ada
  if (f.sto)   params.sto   = f.sto;
  if (f.witel) params.witel = f.witel;
  if (f.hsa)   params.hsa   = f.hsa;

  const modal = new bootstrap.Modal(
    document.getElementById('global-modal')
  );
  const modalBody  = document.querySelector('#global-modal .modal-body');
  const modalTitle = document.querySelector('#global-modal .modal-title');

  modalTitle.textContent = 'Detail TOTAL Underspec B2C';
  modalBody.innerHTML = `<div class="text-center my-4"><div class="spinner-border"></div></div>`;
  modal.show();

  // Map kolom ke mode sesuai tabel
  const map = {
    4:{mode:'UNSPEC'},
    5:{mode:'SPEC'},
    6:{mode:'REGULER'},
    7:{mode:'GOLD'},
    8:{mode:'PLATINUM'},
    9:{mode:'DIAMOND'},
    10:{mode:'SWINGIN'},
    11:{mode:'BERULANG'}
  };

  const qs = new URLSearchParams({
    ...params,
    ...(map[colIndex] || {})
  }).toString();

  fetch(API_URL + '?' + qs)
    .then(res => res.json())
    .then(resData => {
      const rows = resData.data || [];
      if (!rows.length) {
        modalBody.innerHTML =
          `<div class="text-center text-muted py-4">Tidak ada data</div>`;
        return;
      }

      let html = `
        <div class="table-responsive">
          <table class="table table-dark table-striped table-sm text-center align-middle">
            <thead>
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
            <td>${r.SEKTOR}</td>
            <td>${r['NODE ID(NODE IP)']}</td>
            <td>${r['SHELF|SLOT|PORT| ONU ID']}</td>
            <td>${r.CMDF}</td>
            <td>${r.DP}</td>
            <td>${r.ND}</td>
            <td>${r['ONU RX POWER']}</td>
            <td>${r['UKUR ULANG']}</td>
            <td>${r['FLAG HVC']}</td>
          </tr>
        `;
      });

      modalBody.innerHTML = html + '</tbody></table></div>';
    })
    .catch(err => {
      modalBody.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    });
}

