const API_URL = "https://script.google.com/macros/s/AKfycbyj_xhjKdCzPsQTOQENE3AgdZ4y0NGiGQ5D7ogVs9dA6LCQBvFi8ccMH4MLifajS9uQ/exec";

function sendRequest(page, action, data){
  return fetch(API_URL,{
    method:"POST",
    body: JSON.stringify({
      page: page,
      action: action,
      ...data
    })
  })
  .then(res => res.json());
}

