/* =====================================================
   INIT UNDERSPEC B2C
===================================================== */
function initUnderspecB2C(API_URL) {
  window.API_URL = API_URL;
  const el = document.getElementById("underspec-table");

  el.innerHTML = `<div class="text-center my-3"><div class="spinner-border"></div></div>`;

  fetch(`${API_URL}?type=monitoring_usb2c`)
    .then(r => r.json())
    .then(res => {
      if(res.error){ el.innerHTML=`<div class="alert alert-danger">${res.message}</div>`; return; }
      const data = res.data || [];

      let html = `
        <table class="table table-sm table-bordered table-striped text-center align-middle" id="underspec-table-main">
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

      const total = new Array(12).fill(0);

      data.forEach(row => {
        const [
          sektor, witel, hsa, osa,
          saldoAwalUnspec, saldoAwalSpec,
          reguler, gold, platinum, diamond,
          swingin, unspecBerulang
        ] = row;

        total[0]+= saldoAwalUnspec||0;
        total[1]+= saldoAwalSpec||0;
        total[2]+= reguler||0;
        total[3]+= gold||0;
        total[4]+= platinum||0;
        total[5]+= diamond||0;
        total[6]+= swingin||0;
        total[7]+= unspecBerulang||0;

        html += `
          <tr data-sektor="${sektor}">
            <td>${sektor||'-'}</td>
            <td>${witel||'-'}</td>
            <td>${hsa||'-'}</td>
            <td>${osa||'-'}</td>

            <td class="clickable ${saldoAwalUnspec>0?'value-bad':''}" onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','unspec')">${saldoAwalUnspec||0}</td>
            <td class="clickable ${saldoAwalSpec>0?'value-bad':''}" onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','spec')">${saldoAwalSpec||0}</td>

            <td class="clickable ${reguler>0?'value-bad':''}" onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','reguler')">${reguler||0}</td>
            <td class="clickable ${gold>0?'value-bad':''}" onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','gold')">${gold||0}</td>
            <td class="clickable ${platinum>0?'value-bad':''}" onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','platinum')">${platinum||0}</td>
            <td class="clickable ${diamond>0?'value-bad':''}" onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','diamond')">${diamond||0}</td>

            <td class="clickable ${swingin>0?'value-bad':''}" onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','swingin')">${swingin||0}</td>
            <td class="clickable ${unspecBerulang>0?'value-bad':''}" onclick="openDetailUnderspecB2C('${API_URL}','${sektor}','berulang')">${unspecBerulang||0}</td>
          </tr>
        `;
      });

      html += `
        <tr class="total-row-custom">
          <td colspan="4" class="text-end total-cell-custom">TOTAL</td>
          ${total.slice(0,8).map((v,i)=>`<td class="clickable total-cell-custom ${v>0?'value-bad':''}" onclick="openTotalDetailUnderspecB2C(${i+4})">${v}</td>`).join('')}
        </tr>
      `;

      html += `</tbody></table>`;
       el.innerHTML = html;
      initGponMengelompok(API_URL);

    }).catch(err=>{
      el.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    });
}

/* =====================================================
   INIT GPON MENGelompok
===================================================== */
function initGponMengelompok(API_URL) {
  const el = document.getElementById('underspec-gpon-mengelompok');
  el.innerHTML = `<div class="text-center my-3"><div class="spinner-border"></div></div>`;

  fetch(`${API_URL}?type=monitoring_usb2c_gpon`)
    .then(r => r.json())
    .then(res => {
      if(res.error){
        el.innerHTML = `<div class="text-danger text-center">${res.message}</div>`;
        return;
      }

      const data = res.data || [];
      if(!data.length){
        el.innerHTML = `<div class="text-center text-muted py-3">Tidak ada data</div>`;
        return;
      }

      let html = `<table class="table table-sm text-center table-bordered">
        <thead class="table-dark">
          <tr>
            <th>GPON (Node & Shelf|Slot|Port)</th>
            <th>Total</th>
            <th>Unspec</th>
            <th>Spec</th>
          </tr>
        </thead>
        <tbody>`;

      data.forEach(d => {
        // Pisahkan NODE ID dan SHELF|SLOT|PORT
        const gponRaw = d.gpon || '';
        const parts = gponRaw.split('|').map(s => s.trim());

        const nodeIdRaw = parts[0] || '';
        const nodeId = nodeIdRaw.split('(')[0].trim(); // tanpa IP
        const shelf = parts[1] || '';
        const slot  = parts[2] || '';
        const port  = parts[3] || '';

        // Key untuk detail
        const nodeShelf = `${nodeId}|${shelf}|${slot}|${port}`;
        const encodedNodeShelf = encodeURIComponent(nodeShelf);

        html += `<tr>
          <td>${nodeId} | ${shelf} | ${slot} | ${port}</td>
          <td class="clickable ${d.total>0?'value-bad':''}" 
              style="cursor:pointer;" 
              onclick="openDetailGpon('${encodedNodeShelf}')">${d.total}</td>
          <td class="clickable ${d.unspec>0?'value-bad':''}" 
              style="cursor:pointer;" 
              onclick="openDetailGpon('${encodedNodeShelf}')">${d.unspec}</td>
          <td class="clickable ${d.spec>0?'value-bad':''}" 
              style="cursor:pointer;" 
              onclick="openDetailGpon('${encodedNodeShelf}')">${d.spec}</td>
        </tr>`;
      });

      html += `</tbody></table>`;
      el.innerHTML = html;
    })
    .catch(err=>{
      el.innerHTML = `<div class="alert alert-danger text-center">${err.message}</div>`;
    });
}

/* =====================================================
   MODAL DETAIL UNDERSPEC B2C
===================================================== */
function openDetailUnderspecB2C(API_URL, sektor, mode) {
  const modal = new bootstrap.Modal(document.getElementById('global-modal'));
  const modalBody = document.querySelector('#global-modal .modal-body');
  const modalTitle = document.querySelector('#global-modal .modal-title');

  modalTitle.textContent = `Detail Underspec B2C – ${sektor} (${mode.toUpperCase()})`;
  modalBody.innerHTML = `<div class="text-center my-4"><div class="spinner-border"></div></div>`;
  modal.show();

  fetch(`${API_URL}?type=monitoring_usb2c_detail&sektor=${encodeURIComponent(sektor)}&mode=${mode}`)
    .then(r => r.json())
    .then(res => {
      const rows = res.data || [];
      if(!rows.length){ modalBody.innerHTML = `<div class="text-center text-muted py-4">Tidak ada data</div>`; return; }

      let html = `<div class="table-responsive">
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

      rows.forEach(r=>{
        html += `<tr>
          <td>${r.SEKTOR||'-'}</td>
          <td>${r['NODE ID(NODE IP)']||'-'}</td>
          <td>${r['SHELF|SLOT|PORT| ONU ID']||'-'}</td>
          <td>${r.CMDF||'-'}</td>
          <td>${r.DP||'-'}</td>
          <td>${r.ND||'-'}</td>
          <td>${r['ONU RX POWER']||'-'}</td>
          <td>${r['UKUR ULANG']||'-'}</td>
          <td>${r['FLAG HVC']||'-'}</td>
        </tr>`;
      });

      modalBody.innerHTML = html + `</tbody></table></div>`;
    })
    .catch(err=>{ modalBody.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; });
}

/* =====================================================
   DETAIL TOTAL UNDERSPEC B2C
===================================================== */
function openTotalDetailUnderspecB2C(colIndex) {
  const f = window.B2C_ACTIVE_FILTER || {};
  const params = { type: 'monitoring_usb2c_total_detail' };
  if(f.sto) params.sto=f.sto;
  if(f.witel) params.witel=f.witel;
  if(f.hsa) params.hsa=f.hsa;

  const modal = new bootstrap.Modal(document.getElementById('global-modal'));
  const modalBody = document.querySelector('#global-modal .modal-body');
  const modalTitle = document.querySelector('#global-modal .modal-title');

  modalTitle.textContent = 'Detail TOTAL Underspec B2C';
  modalBody.innerHTML = `<div class="text-center my-4"><div class="spinner-border"></div></div>`;
  modal.show();

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

  const qs = new URLSearchParams({...params, ...(map[colIndex]||{})}).toString();

  fetch(`${window.API_URL}?${qs}`)
    .then(r=>r.json())
    .then(resData=>{
      const rows = resData.data || [];
      if(!rows.length){ modalBody.innerHTML = `<div class="text-center text-muted py-4">Tidak ada data</div>`; return; }

      let html = `<div class="table-responsive">
        <table class="table table-striped table-sm text-center align-middle">
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

      rows.forEach(r=>{
        html += `<tr>
          <td>${r.SEKTOR||'-'}</td>
          <td>${r['NODE ID(NODE IP)']||'-'}</td>
          <td>${r['SHELF|SLOT|PORT| ONU ID']||'-'}</td>
          <td>${r.CMDF||'-'}</td>
          <td>${r.DP||'-'}</td>
          <td>${r.ND||'-'}</td>
          <td>${r['ONU RX POWER']||'-'}</td>
          <td>${r['UKUR ULANG']||'-'}</td>
          <td>${r['FLAG HVC']||'-'}</td>
        </tr>`;
      });

      modalBody.innerHTML = html + '</tbody></table></div>';
    })
    .catch(err=>{ modalBody.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; });
}

/* =====================================================
   DETAIL GPON MODAL
===================================================== */
function openDetailGpon(encodedNodeShelf) {
  const nodeShelf = decodeURIComponent(encodedNodeShelf); // decode URL
  const modal = new bootstrap.Modal(document.getElementById('global-modal'));
  const modalBody = document.querySelector('#global-modal .modal-body');
  const modalTitle = document.querySelector('#global-modal .modal-title');

  modalTitle.textContent = `Detail GPON – ${nodeShelf}`;
  modalBody.innerHTML = `<div class="text-center my-4"><div class="spinner-border"></div></div>`;
  modal.show();

  fetch(`${window.API_URL}?type=monitoring_usb2c_gpon_detail&nodeShelf=${encodeURIComponent(nodeShelf)}`)
    .then(r => r.json())
    .then(res => {
      const rows = res.data || [];
      if(!rows.length){
        modalBody.innerHTML = `<div class="text-center text-muted py-4">Tidak ada data</div>`;
        return;
      }

      let html = `<div class="table-responsive">
        <table class="table table-striped table-sm text-center align-middle">
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
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>`;

      rows.forEach(r => {
        html += `<tr>
          <td>${r.SEKTOR}</td>
          <td>${r['NODE ID(NODE IP)']}</td>
          <td>${r['SHELF|SLOT|PORT| ONU ID']}</td>
          <td>${r.CMDF}</td>
          <td>${r.DP}</td>
          <td>${r.ND}</td>
          <td>${r['ONU RX POWER']}</td>
          <td>${r['UKUR ULANG']}</td>
          <td>${r['FLAG HVC']}</td>
          <td>${r.STATUS}</td>
        </tr>`;
      });

      modalBody.innerHTML = html + '</tbody></table></div>';
    })
    .catch(err=>{
      modalBody.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    });
}

