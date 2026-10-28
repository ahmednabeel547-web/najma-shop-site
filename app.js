import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,collection,doc,addDoc,updateDoc,deleteDoc,onSnapshot,writeBatch} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CFG={apiKey:"AIzaSyDY4iopGYA3eIahhaIB6ZB1IAPWrU39Fgw",authDomain:"najma-shop-2a926.firebaseapp.com",projectId:"najma-shop-2a926",appId:"1:828513452951:web:85f24f3468cfa503ff3ad2"};
const WHATSAPP="";
const CUR=" د.ع";

const $=id=>document.getElementById(id);
let S=[],P=[],role=null,C={};
try{C=JSON.parse(localStorage.getItem('najma_cart'))||{}}catch(e){}
const saveC=()=>{try{localStorage.setItem('najma_cart',JSON.stringify(C))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const fmt=n=>Number(n).toLocaleString('en-US')+CUR;
const find=id=>P.find(p=>p.id===id);

const app=initializeApp(CFG);
const auth=getAuth(app), db=getFirestore(app);

function enter(r){
  role=r;$('land').style.display='none';
  const a=$('app');a.style.display='block';a.className=r==='owner'?'admin':'';
  $('cu').style.display=r==='owner'?'none':'';
  render();
}
async function ownerLogin(){
  try{await signInWithEmailAndPassword(auth,$('em').value.trim(),$('pw').value)}
  catch(e){$('err').textContent='البريد أو كلمة السر غير صحيحة'}
}
async function logout(){try{await signOut(auth)}catch(e){}location.reload()}
onAuthStateChanged(auth,u=>{if(u)enter('owner')});

onSnapshot(collection(db,'sections'),s=>{S=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.o||0)-(b.o||0));render()});
onSnapshot(collection(db,'products'),s=>{P=s.docs.map(d=>({id:d.id,...d.data()}));render()});

function render(){
  if(!role)return;
  const q=$('q').value.trim().toLowerCase(),own=role==='owner';
  $('nav').innerHTML=S.map(s=>`<a href="#${s.id}">${esc(s.n)}</a>`).join('');
  let h='';
  S.forEach(s=>{
    const items=P.filter(p=>p.s===s.id&&(!q||p.n.toLowerCase().includes(q)));
    if(q&&!items.length)return;
    h+=`<h2 id="${s.id}">${esc(s.n)}</h2>`;
    if(own)h+=`<div class="adm"><button onclick="renSec('${s.id}')">تعديل الاسم</button><button onclick="addProd('${s.id}')">+ منتج</button><button class="red" onclick="delSec('${s.id}')">حذف القسم</button></div>`;
    h+='<div class="products">'+(items.length?items.map(p=>
      `<div class="card"><div class="img" style="background-image:${p.i?`url(${p.i})`:'none'}"></div><h3>${esc(p.n)}</h3><div class="price">${fmt(p.p)}</div>
      <div class="row"><button onclick="add('${p.id}')">🛒 أضف للعربة</button></div>
      ${own?`<div class="row"><button onclick="setImg('${p.id}')">صورة</button><button onclick="editProd('${p.id}')">تعديل</button><button class="red" onclick="delProd('${p.id}')">حذف</button></div>`:''}</div>`
    ).join(''):'<div class="empty" style="grid-column:1/-1">لا توجد منتجات</div>')+'</div>';
  });
  $('main').innerHTML=h||'<div class="empty">'+(own?'لا توجد أقسام. اضغط "+ قسم" للبدء.':'لا توجد أقسام بعد')+'</div>';
  let n=0;for(const k in C){if(find(k))n+=C[k]}
  $('cnt').textContent=n;
}

function add(id){C[id]=(C[id]||0)+1;saveC();render()}
function qty(id,d){C[id]=(C[id]||0)+d;if(C[id]<=0)delete C[id];saveC();openCart();render()}
function clr(){C={};saveC();openCart();render()}
function openCart(){
  let h='<h3 style="margin-top:0">🛒 عربة التسوق</h3>',t=0;
  const ids=Object.keys(C).filter(find);
  if(!ids.length)h+='<div class="empty">العربة فارغة</div>';
  ids.forEach(id=>{const p=find(id);t+=p.p*C[id];
    h+=`<div class="ci"><b>${esc(p.n)}<br><small>${fmt(p.p)}</small></b><button onclick="qty('${id}',-1)">−</button><span>${C[id]}</span><button onclick="qty('${id}',1)">+</button></div>`});
  if(ids.length)h+=`<h3>المجموع: ${fmt(t)}</h3><button style="width:100%" onclick="order()">إرسال الطلب</button><button class="gray" style="width:100%;margin-top:8px" onclick="clr()">تفريغ العربة</button>`;
  h+='<button class="gray" style="width:100%;margin-top:8px" onclick="document.getElementById(\'cart\').style.display=\'none\'">إغلاق</button>';
  $('cbox').innerHTML=h;$('cart').style.display='block';
}
function order(){
  let t=0,m='طلب جديد من متجر نجمة:\n';
  Object.keys(C).forEach(id=>{const p=find(id);if(p){t+=p.p*C[id];m+=`- ${p.n} × ${C[id]} = ${fmt(p.p*C[id])}\n`}});
  m+='المجموع: '+fmt(t);
  if(WHATSAPP)window.open('https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent(m));
  else if(navigator.clipboard){navigator.clipboard.writeText(m);alert('تم نسخ الطلب. أرسله للمتجر.')}
  else alert(m);
}

const fail=e=>alert('فشلت العملية: '+(e.code||e.message));
async function addSec(){const n=prompt('اسم القسم:');if(n)try{await addDoc(collection(db,'sections'),{n,o:Date.now()})}catch(e){fail(e)}}
async function renSec(id){const s=S.find(x=>x.id===id),n=prompt('الاسم الجديد:',s.n);if(n)try{await updateDoc(doc(db,'sections',id),{n})}catch(e){fail(e)}}
async function delSec(id){
  if(!confirm('حذف القسم وكل منتجاته؟'))return;
  try{const b=writeBatch(db);P.filter(p=>p.s===id).forEach(p=>b.delete(doc(db,'products',p.id)));b.delete(doc(db,'sections',id));await b.commit()}catch(e){fail(e)}
}
async function addProd(s){
  const n=prompt('اسم المنتج:');if(!n)return;
  const p=parseFloat(prompt('السعر:'));if(isNaN(p))return;
  try{await addDoc(collection(db,'products'),{s,n,p,i:''})}catch(e){fail(e)}
}
async function editProd(id){
  const p=find(id),n=prompt('اسم المنتج:',p.n);if(n===null)return;
  const pr=parseFloat(prompt('السعر:',p.p));
  try{await updateDoc(doc(db,'products',id),{n:n||p.n,p:isNaN(pr)?p.p:pr})}catch(e){fail(e)}
}
async function delProd(id){if(confirm('حذف المنتج؟'))try{await deleteDoc(doc(db,'products',id))}catch(e){fail(e)}}
function setImg(id){
  const f=$('file');f.value='';
  f.onchange=()=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=async()=>{
    const k=Math.min(1,500/Math.max(im.width,im.height)),c=document.createElement('canvas');
    c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);
    try{await updateDoc(doc(db,'products',id),{i:c.toDataURL('image/jpeg',.65)})}catch(e){fail(e)}};im.src=r.result};
    if(f.files[0])r.readAsDataURL(f.files[0])};
  f.click();
}
Object.assign(window,{enter,ownerLogin,logout,render,add,qty,clr,openCart,order,addSec,renSec,delSec,addProd,editProd,delProd,setImg});
