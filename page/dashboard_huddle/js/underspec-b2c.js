function initUnderspecB2C(API_URL) {

  const url = API_URL + "?type=monitoring_usb2c";

  fetch(url)
    .then(res => res.json())
    .then(res => {

      if (res.error) {
        document.getElementById("underspec-table").innerHTML =
          `<div class="alert alert-danger">${res.message}</div>`;
        return;
      }

      let html = `
        <table class="table table-sm table-bordered">
          <thead class="table-dark">
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
        html += `
          <tr>
            <td>${d.sektor}</td>
            <td>${d.witel}</td>
            <td>${d.hsa}</td>
            <td>${d.osa}</td>
            <td class="text-danger fw-bold">${d.total.sisaSaldo}</td>
            <td>${d.total.hasilPerbaikan}</td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      document.getElementById("underspec-table").innerHTML = html;

    })
    .catch(err => {
      document.getElementById("underspec-table").innerHTML =
        `<div class="alert alert-danger">${err}</div>`;
    });
}
