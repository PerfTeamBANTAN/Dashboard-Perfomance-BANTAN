let API_URL = "";

function initFunnelingTree(api){

API_URL = api;

loadFunneling();

}

async function loadFunneling(){

const res = await fetch(API_URL + "?sheet=funneling");
const data = await res.json();

renderTree(data);
renderTable(data);

}

function renderTree(data){

const total = data.length;

const survey = data.filter(x=>x.STATUS_SURVEY=="COMPLETE").length;

const install = data.filter(x=>x.STATUS_TASK=="INSTALL").length;

const complete = data.filter(x=>x.STATUS=="COMPWORK").length;

const cancel = data.filter(x=>x.STATUS=="CANCLWORK").length;

document.getElementById("totalOrder").innerText = total;
document.getElementById("surveyCount").innerText = survey;
document.getElementById("installCount").innerText = install;
document.getElementById("completeCount").innerText = complete;
document.getElementById("cancelCount").innerText = cancel;

}

function renderTable(data){

const tbody = document.querySelector("#funnelingTable tbody");

tbody.innerHTML="";

data.forEach(d=>{

tbody.innerHTML+=`

<tr>
<td>${d.WONUM}</td>
<td>${d["DATEL BARU"]}</td>
<td>${d.STO}</td>
<td>${d.CUSTOMER_NAME}</td>
<td>${d.PACKAGE_NAME}</td>
<td>${d.STATUS}</td>
</tr>

`;

});

}
