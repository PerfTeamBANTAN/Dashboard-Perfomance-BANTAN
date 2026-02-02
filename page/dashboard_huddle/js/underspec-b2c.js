function initUnderspecB2C(API_URL) {

  const url = API_URL + "?type=monitoring_usb2c";
  const container = document.getElementById("underspec-table");

  container.innerHTML = `
    <div class="text-center my-3">
      <div class="spinner-border"></div>
    </div>
  `;

  fetch(url)
    .then(res => res.json())
    .then(res => {

      if (res.error) {
        container.innerHTML =
          `<div class="alert alert-danger">${res.message}</div>`;
        return;
      }

      if (!res.data || !res.data.length) {
        container.innerHTML =
          `<div class="alert alert-warning">Data tidak tersedia</div>`;
        return;
      }

      let html = `
        <table class="table table-sm table-bordered table-striped">
          <thead class="table-dark text-center align-middle">
            <tr>
              <th>Sektor</th>
              <th>Witel</th>
              <th>HSA</th>
              <th>OSA</th>
              <th>Sisa Saldo</th>
              <th>Hasil Perbaikan</th>
            </tr>
          </thead>
          <tbody>
      `;

      res.data.forEach(d => {

        const sektor = d.sektor || "-";
        const witel  = d.witel  || "-";
        const hsa    = d.hsa    || "-";
        const osa    = d.osa    || "-";

        const sisaSaldo       = Number(d?.total?.sisaSaldo) || 0;
        const hasilPerbaikan  = Number(d?.total?.hasilPerbaikan) || 0;

        html += `
          <tr>
            <td>${sektor}</td>
            <td>${witel}</td>
            <td>${hsa}</td>
            <td>${osa}</td>
            <td class="text-end fw-bold text-danger">${sisaSaldo}</td>
            <td class="text-end">${hasilPerbaikan}</td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      container.innerHTML = html;

    })
    .catch(err => {
      container.innerHTML =
        `<div class="alert alert-danger">Fetch error: ${err.message}</div>`;
    });
}
