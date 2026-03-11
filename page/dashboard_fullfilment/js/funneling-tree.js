let API_URL="";

function initFunnelingTree(api){

API_URL=api;

document
.getElementById("btnFilter")
.addEventListener("click",loadData);

loadFilterOptions();
loadData();

setInterval(loadData,30000);

}

async function loadData(){

const hsa=document.getElementById("filterHSA").value;
const sto=document.getElementById("filterSTO").value;
const start=document.getElementById("startDate").value;
const end=document.getElementById("endDate").value;

const url=
API_URL
+"?action=funnelingtree"
+"&hsa="+encodeURIComponent(hsa)
+"&sto="+encodeURIComponent(sto)
+"&start="+start
+"&end="+end;

try{

const res=await fetch(url);
const data=await res.json();

renderFunnel(data);

}catch(e){

console.log("ERROR LOAD DATA",e);

}

}

function renderFunnel(data){

update("angka000",data.INPUT_ORDER);
update("angka001",data.PI);
update("angka002",data.WAPPR);

update("angka003",data.STARTWORK);
update("angka004",data.INPROGRESS);
update("angka005",data.COMPWORK);
update("angka006",data.CANCEL);

update("angka007",data.WORKFAIL);
update("angka008",data.PENDWORK);
update("angka009",data.CONTWORK);
update("angka010",data.INSTCOMP);

update("angka011",data.PROGRESS_PS);

update("angka012",data.KDL_PLGN);
update("angka013",data.KDL_TEKNIK);
update("angka014",data.KDL_SISTEM);
update("angka015",data.KDL_LAINNYA);

}

function update(id,val){

const el=document.getElementById(id);

if(!el)return;

animateNumber(el,parseInt(val||0));

}

function animateNumber(el,target){

let start=0;

const step=Math.max(target/20,1);

const timer=setInterval(()=>{

start+=step;

if(start>=target){

el.innerText=target.toLocaleString();
clearInterval(timer);

}else{

el.innerText=Math.floor(start).toLocaleString();

}

},20);

}

async function loadFilterOptions(){

try{

const res=await fetch(API_URL+"?action=filter");
const data=await res.json();

const hsaSelect=document.getElementById("filterHSA");
const stoSelect=document.getElementById("filterSTO");

data.hsa.forEach(v=>{
const opt=document.createElement("option");
opt.value=v;
opt.text=v;
hsaSelect.appendChild(opt);
});

data.sto.forEach(v=>{
const opt=document.createElement("option");
opt.value=v;
opt.text=v;
stoSelect.appendChild(opt);
});

}catch(e){

console.log("ERROR LOAD FILTER",e);

}

}
