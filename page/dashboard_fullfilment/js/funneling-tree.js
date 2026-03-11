let API_URL = "";

function initFunnelingTree(api){

API_URL = api;

loadFilterOptions();

document
.getElementById("btnFilter")
.addEventListener("click",loadData);

loadData();

setInterval(loadData,30000);

}



async function loadFilterOptions(){

try{

const res = await fetch(API_URL+"?action=getfunnelingtree");
const data = await res.json();

const hsaSelect = document.getElementById("filterHSA");
const stoSelect = document.getElementById("filterSTO");

if(data.hsaList){

data.hsaList.forEach(h=>{

const opt = document.createElement("option");
opt.value = h;
opt.textContent = h;

hsaSelect.appendChild(opt);

});

}

if(data.stoList){

data.stoList.forEach(s=>{

const opt = document.createElement("option");
opt.value = s;
opt.textContent = s;

stoSelect.appendChild(opt);

});

}

}catch(e){

console.log("ERROR LOAD FILTER",e);

}

}



async function loadData(){

const hsa = document.getElementById("filterHSA").value;
const sto = document.getElementById("filterSTO").value;
const start = document.getElementById("startDate").value;
const end = document.getElementById("endDate").value;

const url =
API_URL
+"?action=getfunnelingtree"
+"&hsa="+encodeURIComponent(hsa)
+"&sto="+encodeURIComponent(sto)
+"&start="+encodeURIComponent(start)
+"&end="+encodeURIComponent(end);

try{

const res = await fetch(url);
const data = await res.json();

renderFunnel(data);

}catch(e){

console.log("ERROR LOAD FUNNEL",e);

}

}



function renderFunnel(data){

if(!data.cards) return;

const c = data.cards;

setVal("angka000", c["WO PSB"]);
setVal("angka001", c["SUDAH PROGRES"]);
setVal("angka002", c["SISA PROGRES"]);
setVal("angka003", c["MANJA HI EXP"]);
setVal("angka004", c["MANJA H+ & NON MANJA"]);
setVal("angka005", c["SUKSES"]);
setVal("angka006", c["GAGALTARIK"]);
setVal("angka007", c["PS END STATE"]);
setVal("angka008", c["OGP TARIK PS END STATE"]);

}



function setVal(id,obj){

const val = obj?.nilai || 0;

const el = document.getElementById(id);

if(!el) return;

animateNumber(el,val);

}



function animateNumber(el,target){

let start = 0;

const step = target/20;

const timer = setInterval(()=>{

start += step;

if(start>=target){

el.innerText = target.toLocaleString();
clearInterval(timer);

}else{

el.innerText = Math.floor(start);

}

},20);

}
