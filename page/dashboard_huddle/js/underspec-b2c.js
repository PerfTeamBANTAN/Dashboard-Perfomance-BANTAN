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

              <th colspan="2">TOTAL</th>
            </tr>
            <tr>
              <th>UNSPEC</th>
              <th>SPEC</th>

              <th>REGULER</th>
              <th>SILVER</th>
              <th>GOLD</th>
              <th>PLATINUM</th>

              <th>SISA SALDO</th>
              <th>HASIL PERBAIKAN</th>
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
          silver,          // 7
          gold,            // 8
          platinum,        // 9
          swingin,         // 10
          unspecBerulang,  // 11
          sisaSaldo,       // 12
          hasilPerbaikan   // 13
        ] = row;

        html += `
          <tr>
            <td>${sektor || "-"}</td>
            <td>${witel || "-"}</td>
            <td>${hsa || "-"}</td>
            <td>${osa || "-"}</td>

            <td>${saldoAwalUnspec || 0}</td>
            <td>${saldoAwalSpec || 0}</td>

            <td>${reguler || 0}</td>
            <td>${silver || 0}</td>
            <td>${gold || 0}</td>
            <td>${platinum || 0}</td>

            <td>${swingin || 0}</td>
            <td>${unspecBerulang || 0}</td>

            <td class="fw-bold text-danger">${sisaSaldo || 0}</td>
            <td>${hasilPerbaikan || 0}</td>
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
