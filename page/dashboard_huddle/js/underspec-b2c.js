function initUnderspecB2C(API_URL) {

  const url = API_URL + "?type=monitoring_usb2c";
  const el = document.getElementById("underspec-table");

  el.innerHTML = `<div class="text-center my-3"><div class="spinner-border"></div></div>`;

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

      res.data.forEach(d => {

        html += `
          <tr>
            <td>${d.sektor || "-"}</td>
            <td>${d.witel || "-"}</td>
            <td>${d.hsa || "-"}</td>
            <td>${d.osa || "-"}</td>

            <td>${d.saldoAwal?.unspec || 0}</td>
            <td>${d.saldoAwal?.spec || 0}</td>

            <td>${d.sisaSaldoDetail?.reguler || 0}</td>
            <td>${d.sisaSaldoDetail?.silver || 0}</td>
            <td>${d.sisaSaldoDetail?.gold || 0}</td>
            <td>${d.sisaSaldoDetail?.platinum || 0}</td>

            <td>${d.swingin || 0}</td>
            <td>${d.unspecBerulang || 0}</td>

            <td class="fw-bold text-danger">${d.total?.sisaSaldo || 0}</td>
            <td>${d.total?.hasilPerbaikan || 0}</td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      el.innerHTML = html;

    })
    .catch(err => {
      el.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    });
}
