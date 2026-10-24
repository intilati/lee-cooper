'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let products=[],editing=null,pendingDelete=null;
function message(text,error=false){$('#message').textContent=text;$('#message').classList.toggle('error',error);}
async function api(path,options={}){const res=await fetch(path,{...options,cache:'no-store'});if(res.status===401||res.status===403){$('#manager').hidden=true;$('#editor').hidden=true;$('#deleteDialog').close();location.replace('/owner-login/');throw Error('Administrator access is required.');}let data;try{data=await res.json()}catch{throw Error('The service is unavailable. Please try again.')}if(!res.ok)throw Error(data.error||'Unable to complete this request.');return data;}
const send=(path,data,method='POST')=>api(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
async function busy(button,action){button.disabled=true;try{await action()}catch(e){message(e.message,true)}finally{button.disabled=false}}
async function load(){products=await api('/api/products');render();}
function render(){
 $('#productList').innerHTML=products.length?products.map(p=>`<article class="admin-item">${p.sprite?`<span class="sprite-photo" style="background-position:${esc(p.sprite)}"></span>`:`<img src="${esc(p.images[0])}" alt="${esc(p.name)}">`}<div><h2>${esc(p.name)}</h2><p>${esc(p.color)}</p></div><div class="admin-actions"><button class="text-button" data-edit="${esc(p.id)}">EDIT</button><button class="text-button" data-delete="${esc(p.id)}">DELETE</button></div></article>`).join(''):'<p class="empty">No products yet. Add your first style.</p>';
}
function edit(p=null){
 editing=p;$('#editor').hidden=false;$('#editor').reset();$('#editTitle').textContent=p?'Edit product':'Add product';
 for(const k of ['name','color','swatch','description','price'])$('#editor').elements[k].value=p?.[k]??(k==='swatch'?'#414536':'');
 $('#imagePreview').innerHTML=p?(p.sprite?`<span class="sprite-photo" style="background-position:${esc(p.sprite)}"></span>`:p.images.map(src=>`<img src="${esc(src)}" alt="Current product photograph">`).join('')):'';
 $('#editor').scrollIntoView({behavior:'smooth',block:'start'});$('#editor').elements.name.focus();
}
$('#logout').onclick=()=>busy($('#logout'),async()=>{await send('/api/auth',{action:'logout'});location.replace('/owner-login/');});
$('#newProduct').onclick=()=>edit();
$('#cancelEdit').onclick=()=>{$('#editor').hidden=true;editing=null;};
$('#imageInput').onchange=()=>{const files=Array.from($('#imageInput').files);$('#imagePreview').replaceChildren();files.forEach(file=>{const img=document.createElement('img');const url=URL.createObjectURL(file);img.src=url;img.alt=file.name;img.onload=()=>URL.revokeObjectURL(url);$('#imagePreview').append(img)});};
$('#productList').onclick=e=>{const editButton=e.target.closest('[data-edit]');if(editButton)edit(products.find(p=>p.id===editButton.dataset.edit));const del=e.target.closest('[data-delete]');if(del){pendingDelete=del.dataset.delete;$('#deleteDialog').showModal();}};
$('#cancelDelete').onclick=()=>$('#deleteDialog').close();
$('#confirmDelete').onclick=()=>busy($('#confirmDelete'),async()=>{try{await send('/api/products',{id:pendingDelete},'DELETE');$('#deleteDialog').close();if(editing?.id===pendingDelete)$('#editor').hidden=true;await load();message('Product deleted from the collection.');}catch(e){$('#deleteDialog').close();throw e}});
$('#editor').onsubmit=e=>{e.preventDefault();busy($('#saveProduct'),async()=>{
 const form=e.currentTarget, files=Array.from($('#imageInput').files);
 if(files.length>8)throw Error('Choose up to eight photographs.');
 for(const file of files)if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>4*1024*1024)throw Error('Choose PNG, JPEG, or WebP images smaller than 4 MB each.');
 let images=editing?.images||[],sprite=editing?.sprite||null;
 if(files.length){message('Uploading photographs…');images=[];for(const file of files){const data=new FormData();data.append('image',file);const uploaded=await api('/api/images',{method:'POST',body:data});images.push(uploaded.url);}sprite=null;}
 if(!images.length&&!sprite)throw Error('Add at least one product photograph.');
 const fields=form.elements;
 await send('/api/products',{id:editing?.id,name:fields.name.value,color:fields.color.value,swatch:fields.swatch.value,description:fields.description.value,price:fields.price.value===''?null:Number(fields.price.value),images,sprite,sample:!!sprite},editing?'PUT':'POST');
 $('#editor').hidden=true;editing=null;await load();message('Product saved. The public collection is updated.');
 });};
async function init(){
 try {
  const session=await api('/api/auth');
  if (!session.admin) { location.replace('/owner-login/'); return; }
  $('#manager').hidden=false;
  await load();
 } catch(e){ message(e.message,true); }
}
document.addEventListener('visibilitychange',async()=>{if(document.visibilityState==='visible'){try{const session=await api('/api/auth');if(!session.admin){$('#manager').hidden=true;location.replace('/owner-login/');}}catch{ $('#manager').hidden=true;message('Unable to verify your administrator session. Reload to sign in again.',true);}}});
window.addEventListener('pageshow',e=>{if(e.persisted){$('#manager').hidden=true;init();}});
init();
