(function(){
const D=window.OBS_DATA;
window.JP={D};

function byId(id){return D.indicators.find(x=>x.id===id)}
function years(ind){return Object.keys(ind.values||{}).map(Number).filter(Number.isFinite).sort((a,b)=>a-b)}
function fmt(ind,v,dec){
  if(v==null || v==="N/D") return '—';
  if(ind.valueType==='text') return String(v);
  if(Number.isNaN(Number(v))) return '—';
  v=Number(v); let d=dec ?? ind.decimals ?? (Math.abs(v)>=1000?0:1);
  if(ind.unit==='%') return v.toLocaleString('es-PE',{minimumFractionDigits:d,maximumFractionDigits:d})+'%';
  if(ind.unit && ind.unit.includes('millones')) return 'S/ '+v.toLocaleString('es-PE',{maximumFractionDigits:0})+' mill.';
  if(ind.unit==='S/' || (ind.unit||'').startsWith('S/')) return 'S/ '+v.toLocaleString('es-PE',{maximumFractionDigits:d});
  if((ind.unit||'').includes('hectáreas') || ind.unit==='ha') return v.toLocaleString('es-PE',{maximumFractionDigits:0})+' ha';
  if((ind.unit||'').includes('casos') || ind.unit==='personas') return v.toLocaleString('es-PE',{maximumFractionDigits:0});
  if((ind.unit||'').includes('por 1 000')) return v.toLocaleString('es-PE',{maximumFractionDigits:1});
  return v.toLocaleString('es-PE',{maximumFractionDigits:d})+(ind.unit?' '+ind.unit:'');
}
function deltaInfo(ind,a,b){
  if(a==null||b==null) return null;
  const d=b-a;
  const pct=a!==0?d/a*100:null;
  let good=null;
  if(ind.direction==='up') good=d>0;
  if(ind.direction==='down') good=d<0;
  return {d,pct,good};
}
function pp(d){return (d>=0?'+':'')+d.toLocaleString('es-PE',{maximumFractionDigits:1})+' p.p.'}
function pct(d){return (d>=0?'+':'')+d.toLocaleString('es-PE',{maximumFractionDigits:1})+'%'}
function gestionForYear(y){return D.gestiones.find(g=>y>=g.inicio&&y<=g.fin)}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function drawGestionBars(gestiones,allY,x,plotBottom,H){
  if(!gestiones||!gestiones.length)return '';
  const seen=new Set();
  const visible=gestiones.filter(g=>{
    if(!g||seen.has(g.id||g.nombre))return false;
    seen.add(g.id||g.nombre);
    return Math.min(g.fin,allY[allY.length-1])>=Math.max(g.inicio,allY[0]);
  });
  if(!visible.length)return '';
  const y=plotBottom+35;
  return visible.map(g=>{
    const start=Math.max(g.inicio,allY[0]),end=Math.min(g.fin,allY[allY.length-1]);
    const x1=x(start),x2=x(end),color=g.color||'#D97728';
    return `<g class="gestion-band" data-gestion="${esc(g.id||g.nombre)}"><line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" stroke="${color}" stroke-width="4" stroke-linecap="round"/><line x1="${x1}" x2="${x1}" y1="${y-4}" y2="${y+4}" stroke="${color}" stroke-width="2"/><line x1="${x2}" x2="${x2}" y1="${y-4}" y2="${y+4}" stroke="${color}" stroke-width="2"/><text class="gestion-label" fill="${color}" x="${(x1+x2)/2}" y="${y+13}" text-anchor="middle"><tspan x="${(x1+x2)/2}">${esc(g.nombre)}</tspan><tspan x="${(x1+x2)/2}" dy="11">${esc(g.periodo)}</tspan></text></g>`;
  }).join('');
}

function chartHitRects(allY,x,p,W,H,ind,peru){
  return allY.map((yr,i)=>{
    const cx=x(yr);
    const prev=i===0?p.l:(x(allY[i-1])+cx)/2;
    const next=i===allY.length-1?W-p.r:(cx+x(allY[i+1]))/2;
    const pv=peru&&Number.isFinite(+peru[yr])?+peru[yr]:'';
    return `<rect class="chart-hit" x="${prev}" y="${p.t}" width="${Math.max(1,next-prev)}" height="${H-p.t-p.b}" data-year="${yr}" data-value="${+ind.values[yr]}" data-peru="${pv}" data-x="${cx}" onpointerenter="JP.chartEnter(event,this)" onpointermove="JP.chartMove(event,this)" onpointerleave="JP.chartLeave(event,this)"></rect>`;
  }).join('');
}


function smoothPath(points,tension=.16){
  if(!points||!points.length)return '';
  if(points.length===1)return `M ${points[0][0]} ${points[0][1]}`;
  const clamp=(v,a,b)=>Math.max(Math.min(a,b),Math.min(Math.max(a,b),v));
  let d=`M ${points[0][0]} ${points[0][1]}`;
  for(let i=0;i<points.length-1;i++){
    const p0=points[i-1]||points[i],p1=points[i],p2=points[i+1],p3=points[i+2]||p2;
    let c1x=p1[0]+(p2[0]-p0[0])*tension;
    let c1y=p1[1]+(p2[1]-p0[1])*tension;
    let c2x=p2[0]-(p3[0]-p1[0])*tension;
    let c2y=p2[1]-(p3[1]-p1[1])*tension;
    c1x=clamp(c1x,p1[0],p2[0]); c2x=clamp(c2x,p1[0],p2[0]);
    c1y=clamp(c1y,p1[1],p2[1]); c2y=clamp(c2y,p1[1],p2[1]);
    d+=` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function svgLine(ind, opts={}){
  const allY=years(ind).filter(y=>!opts.range || (y>=opts.range[0]&&y<=opts.range[1]));
  const vals=allY.map(y=>Number(ind.values[y])).filter(Number.isFinite);
  if(!vals.length) return '';
  const gestiones=opts.gestiones||[];
  const extraBottom=gestiones.length?58:0;
  const W=opts.width||760,H=opts.height||330+extraBottom,p={l:52,r:20,t:25,b:42+extraBottom};
  let min=Math.min(...vals),max=Math.max(...vals); if(max===min){max+=1;min-=1} const pad=(max-min)*.12;min-=pad;max+=pad;
  const x=y=>allY.length===1?(p.l+(W-p.r))/2:p.l+(y-allY[0])/(allY[allY.length-1]-allY[0])*(W-p.l-p.r);
  const yy=v=>p.t+(max-v)/(max-min)*(H-p.t-p.b);
  const plotBottom=H-p.b;
  let s=`<svg class="interactive-svg" data-indicator-id="${esc(ind.id)}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ind.citizen)}">`;
  if(allY.includes(2020)||allY.includes(2021)){
    const x0=x(Math.max(2020,allY[0])),x1=x(Math.min(2021,allY[allY.length-1]));
  }
  for(let i=0;i<4;i++){const v=min+(max-min)*i/3; const yv=yy(v); s+=`<line class="gridline" x1="${p.l}" x2="${W-p.r}" y1="${yv}" y2="${yv}"/><text class="chart-text" x="${p.l-8}" y="${yv+4}" text-anchor="end">${v.toLocaleString('es-PE',{maximumFractionDigits:1})}</text>`}
  const pts=allY.map(y=>[x(y),yy(Number(ind.values[y])),y,Number(ind.values[y])]);
  s+=`<path class="chart-line" d="${smoothPath(pts)}"/>`;
  pts.forEach((a,i)=>{s+=`<circle class="chart-dot" data-point-year="${a[2]}" cx="${a[0]}" cy="${a[1]}" r="4"/>`; if(i===0||i===pts.length-1||a[2]===2019||a[2]===2022) s+=`<text class="chart-label" x="${a[0]}" y="${a[1]-10}" text-anchor="middle">${fmt(ind,a[3],1)}</text>`});
  s+=`<line class="hover-guide" x1="0" x2="0" y1="${p.t}" y2="${plotBottom}"/>`;
  s+=chartHitRects(allY,x,p,W,H,ind,null);
  const tickYears=allY.length<=8?allY:allY.filter((y,i)=>i%2===0||i===allY.length-1);
  tickYears.forEach(y=>s+=`<text class="chart-text" x="${x(y)}" y="${plotBottom+22}" text-anchor="middle">${y}</text>`);
  s+=drawGestionBars(gestiones,allY,x,plotBottom,H);
  s+='</svg>'; return s;
}

function svgCompare(ind, opts={}){
  const ys=years(ind); const peru=ind.peru||{}; const hasPeru=Object.keys(peru).length>0;
  if(!hasPeru) return svgLine(ind, opts);
  const gestiones=opts.gestiones||[];
  const extraBottom=gestiones.length?58:0;
  const vals=[...ys.map(y=>+ind.values[y]),...ys.map(y=>+peru[y]).filter(Number.isFinite)].filter(Number.isFinite);
  const W=760,H=330+extraBottom,p={l:52,r:20,t:25,b:42+extraBottom};let min=Math.min(...vals),max=Math.max(...vals); const pad=(max-min)*.12||1;min-=pad;max+=pad;
  const x=y=>p.l+(y-ys[0])/(ys[ys.length-1]-ys[0]||1)*(W-p.l-p.r), yy=v=>p.t+(max-v)/(max-min)*(H-p.t-p.b);
  const plotBottom=H-p.b;
  let s=`<svg class="interactive-svg" data-indicator-id="${esc(ind.id)}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ind.citizen)}">`;
  for(let i=0;i<4;i++){const v=min+(max-min)*i/3,yv=yy(v);s+=`<line class="gridline" x1="${p.l}" x2="${W-p.r}" y1="${yv}" y2="${yv}"/><text class="chart-text" x="${p.l-8}" y="${yv+4}" text-anchor="end">${v.toLocaleString('es-PE',{maximumFractionDigits:1})}</text>`}
  const j=ys.map(y=>[x(y),yy(+ind.values[y]),y,+ind.values[y]]);s+=`<path class="chart-line" d="${smoothPath(j)}"/>`;
  const ppts=ys.filter(y=>Number.isFinite(+peru[y])).map(y=>[x(y),yy(+peru[y]),y,+peru[y]]);s+=`<path class="chart-line secondary" d="${smoothPath(ppts)}"/>`;
  j.forEach(a=>s+=`<circle class="chart-dot" data-point-year="${a[2]}" cx="${a[0]}" cy="${a[1]}" r="4"/>`);ppts.forEach(a=>s+=`<circle class="chart-dot secondary" data-point-year="${a[2]}" cx="${a[0]}" cy="${a[1]}" r="3.5"/>`);
  s+=`<line class="hover-guide" x1="0" x2="0" y1="${p.t}" y2="${plotBottom}"/>`;
  s+=chartHitRects(ys,x,p,W,H,ind,peru);
  ys.filter((y,i)=>i%2===0||i===ys.length-1).forEach(y=>s+=`<text class="chart-text" x="${x(y)}" y="${plotBottom+22}" text-anchor="middle">${y}</text>`);
  s+=drawGestionBars(gestiones,ys,x,plotBottom,H);
  s+=`<text class="chart-label" x="${W-210}" y="18">El Tambo</text><line class="chart-line" x1="${W-220}" x2="${W-190}" y1="14" y2="14"/><text class="chart-text" x="${W-92}" y="18">Perú</text><line class="chart-line secondary" x1="${W-132}" x2="${W-102}" y1="14" y2="14"/>`;
  s+='</svg>';return s;
}

function ensureChartTooltip(container){
  let tip=container.querySelector('.chart-tooltip');
  if(!tip){tip=document.createElement('div');tip.className='chart-tooltip';container.appendChild(tip)}
  return tip;
}
function chartEnter(e,hit){chartMove(e,hit)}
function chartMove(e,hit){
  const svg=hit.closest('svg'),container=hit.closest('.chart'); if(!svg||!container)return;
  const ind=byId(svg.dataset.indicatorId); if(!ind)return;
  const yr=+hit.dataset.year,val=+hit.dataset.value,peru=hit.dataset.peru===''?null:+hit.dataset.peru;
  const g=gestionForYear(yr);
  const tip=ensureChartTooltip(container);
  const gestion=g?`<div class="tooltip-gestion">${esc(g.nombre)} · ${esc(g.periodo)}</div>`:'';
  const peruRow=Number.isFinite(peru)?`<div class="tooltip-row secondary"><span><i></i>Perú</span><strong>${fmt(ind,peru,1)}</strong></div>`:'';
  tip.innerHTML=`<div class="tooltip-year">${yr}</div>${gestion}<div class="tooltip-row"><span><i></i>El Tambo</span><strong>${fmt(ind,val,1)}</strong></div>${peruRow}`;
  tip.classList.add('show');
  const r=container.getBoundingClientRect(); let left=e.clientX-r.left+14,top=e.clientY-r.top-16;
  const tw=Math.min(280,tip.offsetWidth||240),th=tip.offsetHeight||110;
  if(left+tw>r.width-8) left=e.clientX-r.left-tw-14;
  if(top+th>r.height-8) top=r.height-th-8;
  if(top<8) top=8;
  tip.style.left=left+'px';tip.style.top=top+'px';
  const guide=svg.querySelector('.hover-guide'); if(guide){guide.setAttribute('x1',hit.dataset.x);guide.setAttribute('x2',hit.dataset.x);guide.classList.add('show')}
  svg.querySelectorAll('.chart-dot.active').forEach(n=>n.classList.remove('active'));
  svg.querySelectorAll(`.chart-dot[data-point-year="${yr}"]`).forEach(n=>n.classList.add('active'));
}
function chartLeave(e,hit){
  const svg=hit.closest('svg'),container=hit.closest('.chart');
  const tip=container&&container.querySelector('.chart-tooltip'); if(tip)tip.classList.remove('show');
  const guide=svg&&svg.querySelector('.hover-guide'); if(guide)guide.classList.remove('show');
  if(svg)svg.querySelectorAll('.chart-dot.active').forEach(n=>n.classList.remove('active'));
}

function spark(ind,range=[2019,2022]){
  const ys=years(ind).filter(y=>y>=range[0]&&y<=range[1]),vals=ys.map(y=>+ind.values[y]).filter(Number.isFinite); if(!vals.length)return'';
  const W=270,H=68,p=6;let min=Math.min(...vals),max=Math.max(...vals);if(max===min){max++;min--} const x=i=>p+i/(ys.length-1||1)*(W-2*p),y=v=>p+(max-v)/(max-min)*(H-2*p-14);
  let s=`<svg viewBox="0 0 ${W} ${H}">`; if(ys.includes(2020)&&ys.includes(2021)){const i0=ys.indexOf(2020),i1=ys.indexOf(2021);s+=`<rect class="pandemic" x="${x(i0)-11}" y="0" width="${x(i1)-x(i0)+22}" height="${H-14}"/>`}
  const sparkPts=ys.map((yr,i)=>[x(i),y(+ind.values[yr])]);s+=`<path class="line" d="${smoothPath(sparkPts,.18)}"/>`;
  ys.forEach((yr,i)=>s+=`<circle class="dot" cx="${x(i)}" cy="${y(+ind.values[yr])}" r="3"><title>${yr}: ${esc(fmt(ind,+ind.values[yr],1))}</title></circle><text class="label" x="${x(i)}" y="${H}" text-anchor="middle">${yr}</text>`);
  return s+'</svg>';
}

function nav(){
 const page=document.body.dataset.page||'';
 const h=document.querySelector('[data-header]'); if(!h)return;
 const dimActive=['social','economica','ambiental','institucional','dimensiones'].includes(page);
 h.innerHTML=`<header class="site-header"><div class="container nav-wrap"><a class="brand" href="index.html"><span class="brand-mark brand-party"><img src="assets/logo-partido.png" alt="Logo" aria-hidden="true"></span><span class="brand-text">Héctor Melgar a la<br>Municipalidad Distrital de El Tambo</span></a><button class="menu-toggle" aria-label="Abrir menú" aria-expanded="false">☰</button><nav class="nav-links" aria-label="Navegación principal"><a href="index.html" class="${page==='inicio'?'active':''}">Inicio</a><div class="nav-dropdown ${dimActive?'active':''}"><a class="nav-dropbtn" href="index.html#dimensiones" aria-haspopup="true" aria-expanded="false">Dimensiones <span aria-hidden="true">▾</span></a><div class="nav-menu" role="menu"><a role="menuitem" href="social.html">Dimensión social</a><a role="menuitem" href="economia.html">Dimensión económica</a><a role="menuitem" href="ambiental.html">Dimensión ambiental</a><a role="menuitem" href="institucional.html">Dimensión institucional</a></div></div><a href="comparar.html" class="${page==='comparar'?'active':''}">Comparar periodos</a><a href="junin.html" class="${page==='junin'?'active':''}">El Tambo frente a Junín</a><a href="datos.html" class="${page==='datos'?'active':''}">Indicadores</a><a href="metodologia.html" class="${page==='metodo'?'active':''}">Metodología</a></nav></div></header>`;
 const wrap=h.querySelector('.nav-wrap'),menu=h.querySelector('.nav-links'),toggle=h.querySelector('.menu-toggle'),drop=h.querySelector('.nav-dropdown'),dropBtn=h.querySelector('.nav-dropbtn');
 const closeDrop=()=>{drop.classList.remove('open');dropBtn.setAttribute('aria-expanded','false')};
 drop.addEventListener('mouseenter',()=>{if(window.matchMedia('(min-width: 901px)').matches){drop.classList.add('open');dropBtn.setAttribute('aria-expanded','true')}});
 drop.addEventListener('mouseleave',()=>{if(window.matchMedia('(min-width: 901px)').matches)closeDrop()});
 drop.addEventListener('focusin',()=>{if(window.matchMedia('(min-width: 901px)').matches){drop.classList.add('open');dropBtn.setAttribute('aria-expanded','true')}});
 drop.addEventListener('focusout',e=>{if(window.matchMedia('(min-width: 901px)').matches&&!drop.contains(e.relatedTarget))closeDrop()});
 toggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));if(!open)closeDrop()});
 document.addEventListener('click',e=>{if(!wrap.contains(e.target)){closeDrop();menu.classList.remove('open');toggle.setAttribute('aria-expanded','false')}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrop();menu.classList.remove('open');toggle.setAttribute('aria-expanded','false')}});
}
function footer(){const el=document.querySelector('[data-footer]');if(!el)return;el.innerHTML=`<footer class="footer"><div class="container footer-grid"><div><strong>El Tambo en perspectiva</strong><p>Observatorio distrital de El Tambo con indicadores públicos, comparación de periodos y finanzas municipales.</p></div><div><strong>Explorar</strong><p><a href="index.html#dimensiones">Dimensiones</a><br><a href="comparar.html">Comparar periodos</a><br><a href="junin.html">El Tambo frente a Junín</a><br><a href="datos.html">Indicadores</a></p></div><div><strong>Transparencia</strong><p><a href="metodologia.html">Fuentes y metodología</a></p></div></div></footer>`}

function mascot(){
  const key='eltambo_mascota_oculta_v3';
  const posKey='eltambo_mascota_pos_v3';
  try{if(localStorage.getItem(key)==='1')return}catch(_){ }
  if(document.querySelector('.mascot-widget'))return;
  const facts=[
    'Héctor Melgar es la mejor opción para El Tambo.',
    'Conoce los datos de El Tambo y revisa sus principales brechas.',
    'El Tambo necesita una gestión cercana, ordenada y enfocada en resultados.',
    'Con Héctor Melgar, El Tambo puede dar el siguiente paso.',
    'Este 4 de octubre, marca la P de Podemos Perú.'
  ];
  const w=document.createElement('aside');
  w.className='mascot-widget';
  w.setAttribute('aria-label','Mensaje de campaña de Héctor Melgar');
  w.innerHTML=`<div class="mascot-thought"><span class="mascot-thought-label">Mensaje</span><span class="mascot-thought-text"></span></div><div class="mascot-character-wrap" title="Arrastra para mover"><img class="mascot-character" src="assets/mascota-podemos.png?v=2" alt="Mascota de Podemos Perú"><button class="mascot-close" type="button" aria-label="Ocultar mascota" title="Ocultar">×</button></div>`;
  document.body.appendChild(w);
  const txt=w.querySelector('.mascot-thought-text'),close=w.querySelector('.mascot-close'),dragHandle=w.querySelector('.mascot-character-wrap');
  let i=0,intervalMs=15000,timer=null,swapTimer=null;
  txt.textContent=facts[i];
  const applyDefaultPosition=()=>{w.style.left='';w.style.top='';w.style.right='10px';w.style.bottom='8px'};
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const savePosition=()=>{try{localStorage.setItem(posKey,JSON.stringify({left:parseFloat(w.style.left||''),top:parseFloat(w.style.top||'')}))}catch(_){ }};
  const applySavedPosition=()=>{
    let saved=null;
    try{saved=JSON.parse(localStorage.getItem(posKey)||'null')}catch(_){saved=null}
    if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top)){
      const rect=w.getBoundingClientRect();
      const maxLeft=Math.max(0,window.innerWidth-rect.width-6), maxTop=Math.max(0,window.innerHeight-rect.height-6);
      w.style.right='auto'; w.style.bottom='auto';
      w.style.left=clamp(saved.left,6,maxLeft)+'px';
      w.style.top=clamp(saved.top,6,maxTop)+'px';
    }else{applyDefaultPosition()}
  };
  const rotateFact=()=>{i=(i+1)%facts.length;txt.classList.add('is-changing');clearTimeout(swapTimer);swapTimer=setTimeout(()=>{txt.textContent=facts[i];txt.classList.remove('is-changing')},180)};
  const startTimer=()=>{clearInterval(timer);timer=setInterval(rotateFact,intervalMs)};
  const stopTimer=()=>{clearInterval(timer)};
  startTimer();
  w.addEventListener('mouseenter',stopTimer);
  w.addEventListener('mouseleave',startTimer);
  close.addEventListener('click',()=>{stopTimer();clearTimeout(swapTimer);try{localStorage.setItem(key,'1')}catch(_){ }w.classList.add('is-hiding');setTimeout(()=>w.remove(),220)});

  let dragging=false,startX=0,startY=0,startLeft=0,startTop=0;
  const beginDrag=(clientX,clientY)=>{
    const rect=w.getBoundingClientRect();
    dragging=true;
    w.classList.add('is-dragging');
    w.style.right='auto'; w.style.bottom='auto';
    w.style.left=rect.left+'px'; w.style.top=rect.top+'px';
    startX=clientX; startY=clientY; startLeft=rect.left; startTop=rect.top;
  };
  const moveDrag=(clientX,clientY)=>{
    if(!dragging)return;
    const rect=w.getBoundingClientRect();
    const nextLeft=clamp(startLeft+(clientX-startX),6,window.innerWidth-rect.width-6);
    const nextTop=clamp(startTop+(clientY-startY),6,window.innerHeight-rect.height-6);
    w.style.left=nextLeft+'px';
    w.style.top=nextTop+'px';
  };
  const endDrag=()=>{if(!dragging)return; dragging=false; w.classList.remove('is-dragging'); savePosition();};
  dragHandle.addEventListener('mousedown',e=>{if(e.target===close)return; e.preventDefault(); beginDrag(e.clientX,e.clientY)});
  dragHandle.addEventListener('touchstart',e=>{if(e.target===close)return; const t=e.touches&&e.touches[0]; if(!t)return; beginDrag(t.clientX,t.clientY)}, {passive:true});
  document.addEventListener('mousemove',e=>{if(dragging){e.preventDefault(); moveDrag(e.clientX,e.clientY)}});
  document.addEventListener('touchmove',e=>{if(!dragging)return; const t=e.touches&&e.touches[0]; if(!t)return; moveDrag(t.clientX,t.clientY)}, {passive:true});
  document.addEventListener('mouseup',endDrag);
  document.addEventListener('touchend',endDrag);
  window.addEventListener('resize',applySavedPosition);
  requestAnimationFrame(applySavedPosition);
}

Object.assign(window.JP,{byId,years,fmt,deltaInfo,pp,pct,svgLine,svgCompare,spark,nav,footer,chartEnter,chartMove,chartLeave,gestionForYear,mascot});
document.addEventListener('DOMContentLoaded',()=>{nav();footer();mascot()});
})();
;(function(){
function safeName(s){return String(s||'archivo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,90)||'archivo'}
function saveBlob(blob,name){
  if(!blob)return;
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1800);
}
function chartClone(id){
  const svg=document.getElementById(id);if(!svg)return null;
  const c=svg.cloneNode(true);c.setAttribute('xmlns','http://www.w3.org/2000/svg');
  c.querySelectorAll('.chart-hit,.finance-year-hit').forEach(n=>n.remove());
  c.querySelectorAll('.hover-guide,.finance-hover-guide').forEach(n=>n.remove());
  const st=document.createElementNS('http://www.w3.org/2000/svg','style');
  st.textContent=`
    text{font-family:Arial,Helvetica,sans-serif}.gridline{stroke:#D8E5EC;stroke-width:1}
    .chart-line{fill:none;stroke:#087CB5;stroke-width:3}.chart-line.secondary{stroke:#9AA8B2;stroke-width:2}
    .chart-dot{fill:#087CB5;stroke:#fff;stroke-width:2}.chart-dot.secondary{fill:#9AA8B2}
    .chart-text{font-size:11px;fill:#657984}.chart-label{font-size:12px;fill:#07577F;font-weight:700}
    .gestion-label{font-size:9.5px;font-weight:700}.province-label{font-size:11px;font-weight:800;fill:#26485A;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}
    .province-boundary{fill:none;stroke:#28596F;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
    .district-shape{stroke:#7393A3;stroke-width:.65;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.district-shape.is-eltambo{stroke:#003C5C;stroke-width:2.4}
  `;
  c.insertBefore(st,c.firstChild);
  const vb=(c.getAttribute('viewBox')||'0 0 760 330').split(/\s+/).map(Number),w=vb[2]||760,h=vb[3]||330;
  const bg=document.createElementNS('http://www.w3.org/2000/svg','rect');bg.setAttribute('x','0');bg.setAttribute('y','0');bg.setAttribute('width',w);bg.setAttribute('height',h);bg.setAttribute('fill','#ffffff');c.insertBefore(bg,c.firstChild);
  return c;
}
function serializeSvg(c){return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(c)}
function downloadChartSvg(id,title){const c=chartClone(id);if(!c){alert('No se encontró el gráfico para descargar.');return}saveBlob(new Blob([serializeSvg(c)],{type:'image/svg+xml;charset=utf-8'}),safeName(title)+'.svg')}
function downloadChartPng(id,title){
  const c=chartClone(id);if(!c){alert('No se encontró el gráfico para descargar.');return}
  const vb=(c.getAttribute('viewBox')||'0 0 760 330').split(/\s+/).map(Number),w=vb[2]||760,h=vb[3]||330;
  const blob=new Blob([serializeSvg(c)],{type:'image/svg+xml;charset=utf-8'}),u=URL.createObjectURL(blob),img=new Image();
  img.onload=()=>{try{const scale=2,cv=document.createElement('canvas');cv.width=Math.round(w*scale);cv.height=Math.round(h*scale);const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);ctx.setTransform(scale,0,0,scale,0,0);ctx.drawImage(img,0,0,w,h);URL.revokeObjectURL(u);cv.toBlob(b=>b?saveBlob(b,safeName(title)+'.png'):alert('El navegador no pudo generar el PNG.'),'image/png')}catch(err){console.error(err);URL.revokeObjectURL(u);alert('No se pudo generar el PNG. Prueba la descarga SVG.')}};
  img.onerror=()=>{URL.revokeObjectURL(u);alert('No se pudo convertir el gráfico a PNG. Prueba la descarga SVG.')};img.src=u;
}
function rowsFor(i){return [['Año','Gestión','Valor','Unidad','Fuente'],...Object.keys(i.values||{}).map(Number).sort((a,b)=>a-b).map(y=>{const g=(window.JP.gestionForYear&&window.JP.gestionForYear(y))||{};return [y,g.nombre||g.name||'',i.values[y],i.unit||'',i.source||'']})]}
function downloadRowsCsv(rows,name){const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');saveBlob(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),safeName(name)+'.csv')}
async function downloadRowsXlsx(rows,name){
  if(!window.JSZip){downloadRowsCsv(rows,name);return}
  const z=new JSZip(),esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),col=n=>{let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s},body=rows.map((r,ri)=>'<row r="'+(ri+1)+'">'+r.map((v,ci)=>typeof v==='number'&&Number.isFinite(v)?`<c r="${col(ci+1)}${ri+1}" t="n"><v>${v}</v></c>`:`<c r="${col(ci+1)}${ri+1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`).join('')+'</row>').join('');
  z.file('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  z.folder('_rels').file('.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  z.folder('xl').file('workbook.xml','<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Datos" sheetId="1" r:id="rId1"/></sheets></workbook>');
  z.folder('xl').folder('_rels').file('workbook.xml.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
  z.folder('xl').folder('worksheets').file('sheet1.xml','<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+body+'</sheetData></worksheet>');
  saveBlob(await z.generateAsync({type:'blob'}),safeName(name)+'.xlsx');
}
function downloadIndicatorCsv(i){downloadRowsCsv(rowsFor(i),i.citizen)}
async function downloadIndicatorXlsx(i){return downloadRowsXlsx(rowsFor(i),i.citizen)}
Object.assign(window.JP,{safeName,saveBlob,chartClone,downloadChartSvg,downloadChartPng,downloadRowsCsv,downloadRowsXlsx,downloadIndicatorCsv,downloadIndicatorXlsx});
})();