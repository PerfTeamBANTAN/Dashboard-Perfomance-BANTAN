let API_URL = "";
let rawData = [];

function initFunnelingTree(api){
API_URL = api;
loadData();
startAutoRefresh();
}

/* =========================
LOAD DATA
========================= */

async function loadData(){

try{

const res = await fetch(API_URL + "?sheet=funneling");
const data = await res.json();

rawData = data;

populateFilter(data);

renderDiagram(data);

}catch(err){

console.error("API ERROR",err);

}

}

/* =========================
AUTO REFRESH
========================= */

function startAutoRefresh(){

setInterval(()=>{

applyFilter();

},30000);

}

/* =========================
FILTER DROPDOWN
========================= */

function populateFilter(data){

const hsa = [...new Set(data.map(x=>x.HSA))];
const sto = [...new Set(data.map(x=>x.STO))];

const hsaSelect = document.getElementById("filterHSA");
const stoSelect = document.getElementById("filterSTO");

hsa.forEach(v=>{
if(v){
hsaSelect.innerHTML += `<option>${v}</option>`;
}
});

sto.forEach(v=>{
if(v){
stoSelect.innerHTML += `<option>${v}</option>`;
}
});

}

/* =========================
APPLY FILTER
========================= */

function applyFilter(){

let data = [...rawData];

const hsa = document.getElementById("filterHSA").value;
const sto = document.getElementById("filterSTO").value;
const start = document.getElementById("startDate").value;
const end = document.getElementById("endDate").value;

if(hsa)
data = data.filter(x=>x.HSA===hsa);

if(sto)
data = data.filter(x=>x.STO===sto);

if(start)
data = data.filter(x=> new Date(x.TGL_CREATE)>=new Date(start));

if(end)
data = data.filter(x=> new Date(x.TGL_CREATE)<=new Date(end));

renderDiagram(data);

}

/* =========================
RENDER DIAGRAM
========================= */

function renderDiagram(data){

const count = s => data.filter(x=>x.STATUS===s).length;

const total = data.length;

const result = {

pi:count("PI"),
wappr:count("WAPPR"),
startwork:count("STARTWORK"),
inprogress:count("INPROGRESS"),
compwork:count("COMPWORK"),
cancel:count("CANCLWORK"),

workfail:count("WORKFAIL"),
pendwork:count("PENDWORK"),
contwork:count("CONTWORK"),
instcomp:count("INSTCOMP"),
progressps:count("PROGRESS TO PS"),

kdlplgn:count("KDL PLGN"),
kdlteknik:count("KDL TEKNIK"),
kdlsistem:count("KDL SISTEM"),
kdllain:count("KDL LAINNYA")

};

/* UPDATE SVG */

setVal("angka000",total);
setVal("angka001",result.pi);
setVal("angka002",result.wappr);
setVal("angka003",result.startwork);
setVal("angka004",result.inprogress);
setVal("angka005",result.compwork);
setVal("angka006",result.cancel);

setVal("angka007",result.workfail);
setVal("angka008",result.pendwork);
setVal("angka009",result.contwork);
setVal("angka010",result.instcomp);
setVal("angka011",result.progressps);

setVal("angka012",result.kdlplgn);
setVal("angka013",result.kdlteknik);
setVal("angka014",result.kdlsistem);
setVal("angka015",result.kdllain);

/* COLOR STATUS */

colorStatus("angka005"); // success
colorStatus("angka006"); // cancel
colorStatus("angka007"); // fail

}

/* =========================
SET SVG VALUE
========================= */

function setVal(id,val){

const el=document.getElementById(id);

if(el){

el.textContent = val.toLocaleString();

}

}

/* =========================
STATUS COLOR
========================= */

function colorStatus(id){

const el=document.getElementById(id);

if(!el) return;

const val=parseInt(el.textContent.replace(/,/g,""));

if(val>0){

el.style.fill="#d32f2f";

}else{

el.style.fill="#2e7d32";

}

}

/* =========================
CLICK EVENT DETAIL
========================= */

document.addEventListener("click",function(e){

if(e.target.id.startsWith("angka")){

alert("Open Detail Order : "+e.target.id);

}

});
