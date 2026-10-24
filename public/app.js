'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let products = REFERENCE_PRODUCTS.map(p=>({...p}));
let bag = [];
try { const saved=JSON.parse(localStorage.getItem('lc-reference-bag')||'[]'); if(Array.isArray(saved)) bag=saved.filter(i=>typeof i.id==='string'&&Number.isInteger(i.qty)&&i.qty>0).map(i=>({id:i.id,qty:Math.min(99,i.qty)})); } catch {}
let quantity=1, toastTimer;
const photo=(p, cls='', index=0)=>p.sprite ? `<span class="sprite-photo ${cls}" role="img" aria-label="${esc(p.color+' '+p.name)}" style="background-position:${esc(p.sprite)}"></span>` : `<img class="${cls}" src="${esc(p.images[index]||p.images[0])}" alt="${esc(p.color+' cargo '+(index?'Side view':'Front view'))}" ${cls==='gallery-main'?'':'loading="lazy"'}>`;
const bagButton=()=>`<button class="bag-button" data-open-bag aria-label="Open shopping bag">BAG (<span class="bag-count">${bag.reduce((n,i)=>n+i.qty,0)}</span>)</button>`;
function catalog(){
 $('#main').innerHTML=`<section class="catalog"><div class="toolbar"><p class="eyebrow">LEE COOPER / COLLECTIONS</p>${bagButton()}</div><div class="catalog-heading"><h1>CARGO COLLECTION</h1><span class="style-count">${products.length} STYLES</span></div><div class="product-grid">${products.map(p=>`<a class="product-card" href="#product/${encodeURIComponent(p.id)}" aria-label="View ${esc(p.name+' in '+p.color)}"><div class="card-image">${photo(p)}${p.images.length>1?photo(p,'alternate',1):''}${p.sample?'<span class="sample-label">SAMPLE STYLE</span>':''}<span class="view-label">EXPLORE CARGO</span><span class="card-arrow" aria-hidden="true">↗</span></div><div class="card-meta"><div><h2>${esc(p.name)}</h2><p>${esc(p.color)}</p>${p.price!=null?`<p class="card-price">₹${p.price.toLocaleString('en-IN')}</p>`:''}</div><span class="swatch" style="background:${esc(p.swatch)}" aria-label="${esc(p.color)}"></span></div></a>`).join('')}</div>${products.length?'':'<p class="empty">New cargo styles are coming soon.</p>'}</section>`;
 document.title='Lee Cooper | Cargo Collection';
}
function detail(p){
 quantity=1;
 document.title=p.name+' | Lee Cooper';
 $('#main').innerHTML=`<section class="detail-wrap"><div class="detail-top"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="#collection">COLLECTIONS</a><span>/</span><span>CARGO</span></nav>${bagButton()}</div><div class="product-layout"><div class="gallery"><div id="mainPhoto">${photo(p,'gallery-main')}</div><div class="thumbnails">${(p.sprite?[0]:p.images.map((_,i)=>i)).map(i=>`<button class="thumb ${i===0?'active':''}" data-thumb="${i}" aria-label="View ${i+1}" aria-pressed="${i===0}">${photo(p,'',i)}</button>`).join('')}</div></div><div class="product-info"><p class="eyebrow">LEE COOPER / CARGO COLLECTION</p><h1>${esc(p.name)}</h1>${p.price!=null?`<p class="product-price">₹${p.price.toLocaleString('en-IN')}</p>`:''}<div class="color-row"><b>COLOUR</b><span class="swatch" style="background:${esc(p.swatch)}"></span><span>${esc(p.color)}</span></div><label class="quantity-label">QUANTITY</label><div class="purchase-row"><div class="stepper"><button data-quantity="-1" aria-label="Decrease quantity">−</button><output id="quantity" aria-live="polite">1</output><button data-quantity="1" aria-label="Increase quantity">+</button></div><button class="primary" id="addToBag">ADD TO BAG <span>↗</span></button></div><p class="description">${esc(p.description)}</p>${p.sample?'<p class="sample-detail">SAMPLE STYLE / ILLUSTRATIVE PRODUCT IMAGE</p>':''}<details class="details-block"><summary>PRODUCT DETAILS</summary><p>Functional cargo pockets. Versatile styling and an easy everyday fit. Colour: ${esc(p.color)}.</p></details><details class="details-block"><summary>CARE</summary><p>Follow the care instructions on the garment label. Wash with similar colours.</p></details><a href="#collection" class="back-link">BACK TO COLLECTION</a></div></div></section>`;
 document.querySelectorAll('[data-thumb]').forEach(b=>b.onclick=()=>{ $('#mainPhoto').innerHTML=photo(p,'gallery-main',Number(b.dataset.thumb));document.querySelectorAll('[data-thumb]').forEach(t=>{t.classList.toggle('active',t===b);t.setAttribute('aria-pressed',String(t===b))}) });
 document.querySelectorAll('[data-quantity]').forEach(b=>b.onclick=()=>{quantity=Math.min(99,Math.max(1,quantity+Number(b.dataset.quantity)));$('#quantity').textContent=quantity;});
 $('#addToBag').onclick=()=>{const item=bag.find(i=>i.id===p.id);if(item)item.qty=Math.min(99,item.qty+quantity);else bag.push({id:p.id,qty:quantity});saveBag();toast('Added to your bag');};
}
function route(scroll=true){
 const hash=location.hash;
 if(/(?:invite|recovery)_token=/.test(hash)){location.replace('/owner-login/'+hash);return;}
 let id=null;try { id=hash.startsWith('#product/')?decodeURIComponent(hash.slice(9)):null; } catch {}
 const p=products.find(p=>p.id===id);
 if(p) detail(p);else catalog();
 updateCounts();if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function saveBag(){try{localStorage.setItem('lc-reference-bag',JSON.stringify(bag));}catch{toast('Your bag is available for this visit.');}renderBag();}
function updateCounts(){const n=bag.reduce((n,i)=>n+i.qty,0);document.querySelectorAll('.bag-count').forEach(el=>el.textContent=n);$('#bagTotalCount').textContent=n;}
function renderBag(){
 const visibleBag=bag.filter(i=>products.some(p=>p.id===i.id));updateCounts();
 $('#bagItems').innerHTML=visibleBag.length?visibleBag.map(i=>{const p=products.find(p=>p.id===i.id);return `<article class="cart-item">${photo(p,'cart-photo')}<div><h3>${esc(p.name)}</h3><p>${esc(p.color)}</p><div class="stepper"><button data-bag-step="-1" data-id="${esc(p.id)}" aria-label="Decrease ${esc(p.name)} quantity">−</button><output>${i.qty}</output><button data-bag-step="1" data-id="${esc(p.id)}" aria-label="Increase ${esc(p.name)} quantity">+</button></div><button class="remove" data-remove="${esc(p.id)}">REMOVE</button></div></article>`}).join(''):'<p class="empty">Your bag is empty.<br><br>Explore the cargo collection to get started.</p>';
}
$('#closeBag').onclick=()=>$('#bagDialog').close();
$('#continueShopping').onclick=()=>$('#bagDialog').close();
$('#footerBag').onclick=()=>{renderBag();$('#bagDialog').showModal()};
$('#bagDialog').addEventListener('click',e=>{if(e.target===$('#bagDialog')&&e.clientX<$('#bagDialog').getBoundingClientRect().left)$('#bagDialog').close()});
$('#bagDialog').addEventListener('close',()=>document.body.classList.remove('bag-open'));
new MutationObserver(()=>document.body.classList.toggle('bag-open',$('#bagDialog').open)).observe($('#bagDialog'),{attributes:true,attributeFilter:['open']});
document.addEventListener('click',e=>{
 const open=e.target.closest('[data-open-bag]');if(open){renderBag();$('#bagDialog').showModal();}
 const step=e.target.closest('[data-bag-step]');if(step){const i=bag.find(i=>i.id===step.dataset.id);if(i){i.qty=Math.min(99,Math.max(1,i.qty+Number(step.dataset.bagStep)));saveBag();}}
 const remove=e.target.closest('[data-remove]');if(remove){bag=bag.filter(i=>i.id!==remove.dataset.remove);saveBag();}
});
window.addEventListener('hashchange',()=>route());
window.addEventListener('storage',e=>{if(e.key==='lc-reference-bag'){try{const value=JSON.parse(e.newValue||'[]');if(Array.isArray(value))bag=value.filter(i=>typeof i.id==='string'&&Number.isInteger(i.qty)&&i.qty>0&&i.qty<=99);renderBag();}catch{}}});
route(false);renderBag();
fetch('/api/products',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{if(!Array.isArray(data))throw Error();products=data;bag=bag.filter(i=>products.some(p=>p.id===i.id));route(false);renderBag();}).catch(()=>{/* The bundled reference collection remains available during service interruptions. */});
