document.addEventListener('DOMContentLoaded',()=>{
  const API=window.JP, D=window.OBS_DATA;
  const ga=document.getElementById('gestionA'), gb=document.getElementById('gestionB'), sel=document.getElementById('indicatorSelect');
  const title=document.getElementById('compareTitle'), tech=document.getElementById('compareTech'), kpis=document.getElementById('compareKpis'), chart=document.getElementById('chart'), source=document.getElementById('source');
  if(!API||!D||!ga||!gb||!sel){console.error('Comparador: faltan dependencias');return;}
  const {byId,fmt,deltaInfo,pp,pct,svgLine,years}=API;
  const gens=(D.gestiones||[]).filter(g=>g&&g.id);
  const optionText=g=>`${g.nombre} · ${g.periodo}`;
  ga.innerHTML=gens.map(g=>`<option value="${g.id}">${optionText(g)}</option>`).join('');
  gb.innerHTML=gens.map(g=>`<option value="${g.id}">${optionText(g)}</option>`).join('');
  if(gens.some(g=>g.id==='p2019')) ga.value='p2019'; else if(gens[0]) ga.value=gens[0].id;
  if(gens.some(g=>g.id==='p2023')) gb.value='p2023'; else if(gens[1]) gb.value=gens[1].id;
  const selectable=(D.indicators||[]).filter(i=>i.valueType!=='text'&&years(i).length>=2);
  sel.innerHTML=selectable.map(i=>`<option value="${i.id}">${i.citizen}</option>`).join('');
  if(selectable.some(i=>i.id==='idh')) sel.value='idh'; else if(selectable.some(i=>i.id==='dci')) sel.value='dci'; else if(selectable[0]) sel.value=selectable[0].id;
  const getg=id=>gens.find(g=>g.id===id);
  const metric=(i,g)=>{const ys=years(i).filter(y=>y>=g.inicio&&y<=g.fin);if(ys.length<2)return null;const y0=ys[0],y1=ys[ys.length-1],a=Number(i.values[y0]),b=Number(i.values[y1]);if(!Number.isFinite(a)||!Number.isFinite(b))return null;return {a,b,di:deltaInfo(i,a,b),y0,y1}};
  const card=(i,g,m)=>{const style=`style="border-top-color:${g.color||'#0A9ED0'}"`;if(!m)return `<div class="compare-kpi" ${style}><div class="name">${g.nombre}</div><div class="compare-period">${g.periodo}</div><div class="big">—</div><div class="small">No hay dos observaciones comparables dentro de este periodo.</div></div>`;const change=i.unit==='%'?pp(m.di.d):pct(m.di.pct);return `<div class="compare-kpi" ${style}><div class="name">${g.nombre}</div><div class="compare-period">${g.periodo}</div><div class="big">${change}</div><div class="small">${m.y0}: ${fmt(i,m.a)} → ${m.y1}: ${fmt(i,m.b)}</div></div>`};
  function render(){
    const i=byId(sel.value), A=getg(ga.value), B=getg(gb.value); if(!i||!A||!B){return;}
    const ma=metric(i,A), mb=metric(i,B);
    title.textContent=i.citizen; tech.textContent=i.technical; source.textContent='Fuente: '+i.source;
    kpis.innerHTML=card(i,A,ma)+card(i,B,mb);
    chart.innerHTML=svgLine(i,{gestiones:[A,B],width:900,height:410});
    const svg=chart.querySelector('svg');if(svg)svg.id='compareChartSvg';
    let dl=document.querySelector('#compareDownloads');if(!dl){dl=document.createElement('div');dl.id='compareDownloads';dl.className='download-actions';chart.after(dl)}
    dl.innerHTML='<button id="cmpXlsx">Descargar tabla Excel</button><button id="cmpCsv">CSV</button><button id="cmpPng">Descargar gráfico PNG</button><button id="cmpSvg">SVG</button>';
    const filtered=Object.assign({},i,{values:Object.fromEntries(Object.entries(i.values||{}).filter(([y])=>{const n=+y;return (n>=A.inicio&&n<=A.fin)||(n>=B.inicio&&n<=B.fin)})),citizen:i.citizen+' · '+A.periodo+' vs '+B.periodo});
    document.querySelector('#cmpXlsx').onclick=()=>JP.downloadIndicatorXlsx(filtered);document.querySelector('#cmpCsv').onclick=()=>JP.downloadIndicatorCsv(filtered);document.querySelector('#cmpPng').onclick=()=>JP.downloadChartPng('compareChartSvg',filtered.citizen);document.querySelector('#cmpSvg').onclick=()=>JP.downloadChartSvg('compareChartSvg',filtered.citizen);
  }
  [ga,gb,sel].forEach(el=>el.addEventListener('change',render));
  render();
});