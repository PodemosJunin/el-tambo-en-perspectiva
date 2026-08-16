(function(){
const F=window.FIN_DATA;
if(!F||!window.React||!window.ReactDOM)return;
const h=React.createElement;
const ENTITY='Municipalidad Distrital de El Tambo';
const FILE_PREFIX='El_Tambo';

function money(v){return v==null||!isFinite(+v)?'—':'S/ '+(+v/1e6).toLocaleString('es-PE',{maximumFractionDigits:1})+' mill.'}
function pct(v){return v==null||!isFinite(+v)?'—':Number(v).toLocaleString('es-PE',{maximumFractionDigits:1})+'%'}
function safeName(s){return String(s||'finanzas').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,100)}
function saveBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},900)}
function csv(rows,name){const t=rows.map(r=>r.map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(',')).join('\r\n');saveBlob(new Blob(['\ufeff'+t],{type:'text/csv;charset=utf-8'}),name)}
function colName(n){let s='';while(n){let m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s}
function escXml(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function sheetXml(rows){
 const body=rows.map((r,ri)=>'<row r="'+(ri+1)+'">'+r.map((v,ci)=>{const ref=colName(ci+1)+(ri+1),st=ri===0?' s="1"':'';return typeof v==='number'&&isFinite(v)?`<c r="${ref}" t="n"${st}><v>${v}</v></c>`:`<c r="${ref}" t="inlineStr"${st}><is><t>${escXml(v)}</t></is></c>`}).join('')+'</row>').join('');
 return '<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+body+'</sheetData></worksheet>'
}
async function xlsxMulti(sheets,name){
 if(!window.JSZip){const first=sheets[0];csv(first.rows,name.replace(/\.xlsx$/i,'.csv'));return}
 const z=new JSZip();
 const cleanName=(s,i)=>String(s||('Hoja '+(i+1))).replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,31)||('Hoja '+(i+1));
 const names=sheets.map((s,i)=>cleanName(s.name,i));
 const overrides=sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
 z.file('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+overrides+'</Types>');
 z.folder('_rels').file('.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 const wbSheets=names.map((n,i)=>`<sheet name="${escXml(n)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('');
 z.folder('xl').file('workbook.xml','<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+wbSheets+'</sheets></workbook>');
 const rels=sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
 z.folder('xl').folder('_rels').file('workbook.xml.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rels+'</Relationships>');
 z.folder('xl').file('styles.xml','<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font/><font><b/><color rgb="FFFFFFFF"/></font></fonts><fills count="3"><fill/><fill/><fill><patternFill patternType="solid"><fgColor rgb="FF17324A"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs></styleSheet>');
 const ws=z.folder('xl').folder('worksheets');sheets.forEach((s,i)=>ws.file('sheet'+(i+1)+'.xml',sheetXml(s.rows)));
 saveBlob(await z.generateAsync({type:'blob'}),name)
}
async function xlsx(rows,name){return xlsxMulti([{name:'Datos',rows}],name)}
function financeClone(svg){
 if(!svg)return null;const c=svg.cloneNode(true);c.setAttribute('xmlns','http://www.w3.org/2000/svg');
 const st=document.createElementNS('http://www.w3.org/2000/svg','style');st.textContent='.gridline{stroke:#dfe4e8;stroke-width:1}.chart-text{fill:#53606b;font:12px Arial,sans-serif}.finance-year-hit{display:none}.finance-hover-guide{display:none}.finance-dot{stroke:#fff;stroke-width:1.5}.finance-bar-label{fill:#243849;font:bold 11px Arial,sans-serif}';c.insertBefore(st,c.firstChild);
 const bg=document.createElementNS('http://www.w3.org/2000/svg','rect');bg.setAttribute('x','0');bg.setAttribute('y','0');bg.setAttribute('width','100%');bg.setAttribute('height','100%');bg.setAttribute('fill','#ffffff');c.insertBefore(bg,c.firstChild);return c
}
function downloadSvg(svg,name){const c=financeClone(svg);if(!c)return;saveBlob(new Blob([new XMLSerializer().serializeToString(c)],{type:'image/svg+xml;charset=utf-8'}),name)}
function downloadPng(svg,name){
 const c=financeClone(svg);if(!c)return;const vb=(c.getAttribute('viewBox')||'0 0 1180 430').split(/\s+/).map(Number),w=vb[2]||1180,hh=vb[3]||430;
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)],{type:'image/svg+xml;charset=utf-8'})),img=new Image();
 img.onload=()=>{const cv=document.createElement('canvas');cv.width=w*2;cv.height=hh*2;const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);ctx.scale(2,2);ctx.drawImage(img,0,0,w,hh);URL.revokeObjectURL(url);cv.toBlob(b=>saveBlob(b,name),'image/png')};img.onerror=()=>URL.revokeObjectURL(url);img.src=url
}

function smoothFinancePath(points,tension=.16){
 const clamp=(v,a,b)=>Math.max(Math.min(a,b),Math.min(Math.max(a,b),v));
 if(!points||!points.length)return '';if(points.length===1)return `M ${points[0][0]} ${points[0][1]}`;
 let d=`M ${points[0][0]} ${points[0][1]}`;
 for(let i=0;i<points.length-1;i++){const p0=points[i-1]||points[i],p1=points[i],p2=points[i+1],p3=points[i+2]||p2;let c1x=p1[0]+(p2[0]-p0[0])*tension,c1y=p1[1]+(p2[1]-p0[1])*tension,c2x=p2[0]-(p3[0]-p1[0])*tension,c2y=p2[1]-(p3[1]-p1[1])*tension;c1x=clamp(c1x,p1[0],p2[0]);c2x=clamp(c2x,p1[0],p2[0]);c1y=clamp(c1y,p1[1],p2[1]);c2y=clamp(c2y,p1[1],p2[1]);d+=` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;}return d;
}

function allYears(obj){const ys=new Set();Object.values(obj||{}).forEach(rows=>(rows||[]).forEach(r=>ys.add(+r.year)));return [...ys].filter(Number.isFinite).sort((a,b)=>a-b)}
function rowForYear(rows,year){return (rows||[]).find(r=>+r.year===+year)||null}
function metricLabel(k){return {pia:'PIA',pim:'PIM',devengado:'Devengado',avance:'Avance',peso:'% del gasto total'}[k]||k}
function metricFmt(k,v){return k==='avance'||k==='peso'?pct(v):money(v)}
function metricValue(r,k){return r&&r[k]!=null&&isFinite(+r[k])?+r[k]:null}
function generalSheets(){
 const budget=[['Año','Alcalde / periodo','PIA (S/)','PIM (S/)','Devengado (S/)','Girado (S/)','Avance (%)']].concat((F.budget||[]).map(r=>[r.year,r.gestion||'',r.pia,r.pim,r.devengado,r.girado??'',r.avance]));
 const flat=(obj,label)=>[[label,'Año','Alcalde / periodo','PIA (S/)','PIM (S/)','Devengado (S/)','Girado (S/)','Avance (%)','% del gasto total']].concat(Object.keys(obj||{}).flatMap(name=>(obj[name]||[]).map(r=>[name,r.year,r.gestion||'',r.pia,r.pim,r.devengado,r.girado??'',r.avance,r.peso??''])));
 const meta=[['Campo','Valor'],['Institución',ENTITY],['Fuente',F.source||'MEF – Consulta Amigable'],['Cobertura',F.period||'Según disponibilidad'],['Nota','El archivo contiene únicamente los años disponibles en cada clasificación.']];
 return [{name:'01 Presupuesto',rows:budget},{name:'02 Fuentes',rows:flat(F.sources,'Fuente')},{name:'03 Rubros',rows:flat(F.rubros,'Rubro')},{name:'04 Funciones',rows:flat(F.functions,'Función')},{name:'05 Metadatos',rows:meta}]
}
function attachGeneralButton(){
 const old=document.getElementById('downloadFinanceAll');if(old)return;
 const h2=document.querySelector('#finanzasPublicas .environment-heading .h2')||document.querySelector('.environment-heading .h2');if(!h2)return;
 let row=h2.parentElement.querySelector('.finance-title-row');if(!row){row=document.createElement('div');row.className='finance-title-row';h2.parentNode.insertBefore(row,h2);row.appendChild(h2)}
 const b=document.createElement('button');b.id='downloadFinanceAll';b.className='finance-general-download';b.type='button';b.textContent='Descargar data general ↓';b.title='Descarga presupuesto, fuentes, rubros y funciones en hojas separadas';b.addEventListener('click',()=>xlsxMulti(generalSheets(),FILE_PREFIX+'_Finanzas_Publicas_'+(F.period||'datos')+'.xlsx'));row.appendChild(b)
}

window.FIN_HOVER={move(e,el){const shell=el.closest('.finance-chart'),svg=el.closest('svg');if(!shell||!svg)return;let tip=shell.querySelector('.finance-tooltip');if(!tip){tip=document.createElement('div');tip.className='finance-tooltip';shell.appendChild(tip)}let r={};try{r=JSON.parse(el.getAttribute('data-row')||'{}')}catch(_){return}tip.innerHTML=`<div class="tooltip-year">${r.year}</div><div class="tooltip-gestion">${r.gestion||''}</div><div class="tooltip-row"><span>PIA</span><strong>${money(r.pia)}</strong></div><div class="tooltip-row"><span>PIM</span><strong>${money(r.pim)}</strong></div><div class="tooltip-row"><span>Devengado</span><strong>${money(r.devengado)}</strong></div><div class="tooltip-row"><span>Avance</span><strong>${pct(r.avance)}</strong></div>${r.peso==null?'':`<div class="tooltip-row"><span>Del gasto total</span><strong>${pct(r.peso)}</strong></div>`}`;tip.classList.add('show');const br=shell.getBoundingClientRect();let left=e.clientX-br.left+14,top=e.clientY-br.top-18;const tw=tip.offsetWidth||255,th=tip.offsetHeight||150;if(left+tw>br.width-8)left=e.clientX-br.left-tw-14;if(top+th>br.height-8)top=br.height-th-8;if(top<8)top=8;tip.style.left=left+'px';tip.style.top=top+'px'},leave(e,el){const shell=el.closest('.finance-chart'),t=shell&&shell.querySelector('.finance-tooltip');if(t)t.classList.remove('show')}};

function BudgetChart({rows}){
 const W=1180,H=420,L=82,R=72,T=52,B=60,vals=[];rows.forEach(r=>['pia','pim','devengado'].forEach(k=>isFinite(+r[k])&&vals.push(+r[k])));if(!vals.length)return h('div',{className:'finance-empty'},'Sin datos.');
 const max=Math.max(...vals)*1.08,x=i=>L+i/(rows.length-1||1)*(W-L-R),y=v=>T+(max-(+v||0))/max*(H-T-B),yp=v=>T+(100-Math.max(0,Math.min(100,+v||0)))/100*(H-T-B);
 const ser=[['PIA','pia','#7C8D99',false],['PIM','pim','#087CB5',false],['Devengado','devengado','#00A6E6',false],['Avance','avance','#176B8C',true]];let svg=`<svg id="financeChart" viewBox="0 0 ${W} ${H}" class="finance-svg" xmlns="http://www.w3.org/2000/svg">`;
 [0,.25,.5,.75,1].forEach(q=>{const yy=y(max*q);svg+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" class="gridline"/><text x="${L-9}" y="${yy+4}" text-anchor="end" class="chart-text">${(max*q/1e6).toLocaleString('es-PE',{maximumFractionDigits:0})}</text><text x="${W-R+9}" y="${yy+4}" class="chart-text">${Math.round(q*100)}%</text>`});
 let lx=L;ser.forEach(s=>{svg+=`<g transform="translate(${lx},30)"><line x1="0" x2="22" y1="0" y2="0" stroke="${s[2]}" stroke-width="3"/><text x="28" y="4" class="chart-text">${s[0]}</text></g>`;lx+=s[0].length*7+62});
 ser.forEach(s=>{const fy=s[3]?yp:y,pts=rows.map((r,i)=>[x(i),fy(r[s[1]])]);svg+=`<path fill="none" stroke="${s[2]}" stroke-width="2.8" d="${smoothFinancePath(pts)}"/>`;rows.forEach((r,i)=>svg+=`<circle class="finance-dot" cx="${x(i)}" cy="${fy(r[s[1]])}" r="3.4" fill="${s[2]}"><title>${r.year} · ${s[0]}: ${metricFmt(s[1],r[s[1]])}</title></circle>`) });
 rows.forEach((r,i)=>{if(i%2===0||i===rows.length-1)svg+=`<text x="${x(i)}" y="${H-20}" text-anchor="middle" class="chart-text">${r.year}</text>`});svg+='</svg>';return h('div',{dangerouslySetInnerHTML:{__html:svg}})
}
function CategoryChart({items,metric,year}){
 const data=items.map(it=>({name:it.name,row:it.row,v:metricValue(it.row,metric)}));const valid=data.filter(d=>d.v!=null);if(!valid.length)return h('div',{className:'finance-empty'},'No hay datos para esta variable en '+year+'.');
 const W=1180,L=280,R=88,T=38,B=42,barH=27,gap=13,H=Math.max(270,T+B+data.length*(barH+gap)),max=Math.max(...valid.map(d=>d.v),metric==='avance'||metric==='peso'?100:0)||1,x=v=>L+(Math.max(0,v)/max)*(W-L-R);
 let svg=`<svg id="financeChart" viewBox="0 0 ${W} ${H}" class="finance-svg finance-bars-svg" xmlns="http://www.w3.org/2000/svg">`;
 data.forEach((d,i)=>{const yy=T+i*(barH+gap),val=d.v,short=d.name.length>38?d.name.slice(0,36)+'…':d.name;svg+=`<text x="${L-12}" y="${yy+18}" text-anchor="end" class="finance-bar-label"><title>${d.name}</title>${short}</text>`;if(val!=null){const xx=x(val),w=Math.max(2,xx-L);svg+=`<rect x="${L}" y="${yy}" width="${w}" height="${barH}" rx="3" fill="#176B8C"><title>${d.name} · ${metricLabel(metric)}: ${metricFmt(metric,val)}</title></rect><text x="${Math.min(W-R+6,xx+8)}" y="${yy+18}" class="chart-text">${metricFmt(metric,val)}</text>`}else svg+=`<text x="${L+8}" y="${yy+18}" class="chart-text">Sin dato</text>`});
 svg+=`<text x="${L}" y="22" class="chart-text">${metricLabel(metric)} · ${year}</text></svg>`;return h('div',{dangerouslySetInnerHTML:{__html:svg}})
}

class FinanceApp extends React.Component{
 constructor(props){super(props);const yrs=(F.budget||[]).map(r=>+r.year).filter(Number.isFinite);this.state={mode:'budget',kind:'source',year:yrs.length?Math.max(...yrs):'',metric:'devengado'}}
 dataset(){if(this.state.mode==='budget')return null;if(this.state.mode==='origin')return this.state.kind==='source'?(F.sources||{}):(F.rubros||{});return F.functions||{}}
 years(){return this.state.mode==='budget'?(F.budget||[]).map(r=>+r.year).filter(Number.isFinite).sort((a,b)=>a-b):allYears(this.dataset())}
 syncYear(mode,kind){let obj;if(mode==='budget'){const ys=(F.budget||[]).map(r=>+r.year).filter(Number.isFinite);return ys.length?Math.max(...ys):''}obj=mode==='origin'?(kind==='source'?(F.sources||{}):(F.rubros||{})):(F.functions||{});const ys=allYears(obj);return ys.length?ys[ys.length-1]:''}
 setMode(mode){const kind=this.state.kind;this.setState({mode,year:this.syncYear(mode,kind),metric:'devengado'})}
 setKind(kind){this.setState({kind,year:this.syncYear('origin',kind),metric:'devengado'})}
 renderBudget(){
   const ys=this.years();
   const year=ys.includes(+this.state.year)?+this.state.year:(ys[ys.length-1]||'');
   const r=rowForYear(F.budget,year);
   const table=[['Año','Alcalde / periodo','PIA (S/)','PIM (S/)','Devengado (S/)','Avance (%)']];
   if(r)table.push([r.year,r.gestion||'',r.pia,r.pim,r.devengado,r.avance]);
   const base=FILE_PREFIX+'_Finanzas_Presupuesto_'+year;
   const controls=h('div',{className:'finance-control-row'},
     h('div',{className:'field finance-year-control'},h('label',null,'Año a consultar'),h('select',{value:year,onChange:e=>this.setState({year:+e.target.value})},ys.map(y=>h('option',{key:y,value:y},y)))),
     h('div',{className:'finance-control-note'},'Selecciona un año; el gráfico conserva la trayectoria completa para dar contexto.')
   );
   const head=h('div',{className:'finance-head'},h('div',null,h('div',{className:'eyebrow'},ENTITY+' · '+(F.period||'')),h('h3',null,'Presupuesto general')),h('div',{className:'finance-kpis'},h('span',null,'Año seleccionado: ',h('b',null,year))));
   const cards=r?h('div',{className:'finance-overview'},
     h('div',{className:'finance-overview-card'},h('span',null,'PIA · '+year),h('strong',null,money(r.pia)),h('small',null,'Presupuesto inicial')),
     h('div',{className:'finance-overview-card'},h('span',null,'PIM · '+year),h('strong',null,money(r.pim)),h('small',null,'Presupuesto modificado')),
     h('div',{className:'finance-overview-card'},h('span',null,'Devengado · '+year),h('strong',null,money(r.devengado)),h('small',null,'Gasto ejecutado')),
     h('div',{className:'finance-overview-card'},h('span',null,'Avance · '+year),h('strong',null,pct(r.avance)),h('small',null,'Devengado respecto del PIM'))
   ):null;
   const downloads=h('div',{className:'download-actions'},
     h('button',{onClick:()=>xlsx(table,base+'.xlsx')},'Descargar tabla Excel'),
     h('button',{onClick:()=>csv(table,base+'.csv')},'CSV'),
     h('button',{onClick:()=>downloadPng(document.getElementById('financeChart'),base+'.png')},'Descargar gráfico PNG'),
     h('button',{onClick:()=>downloadSvg(document.getElementById('financeChart'),base+'.svg')},'SVG')
   );
   let detail=null;
   if(r){
     const header=h('thead',null,h('tr',null,table[0].map(x=>h('th',{key:x},x))));
     const body=h('tbody',null,h('tr',null,h('td',null,r.year),h('td',null,r.gestion||'—'),h('td',null,money(r.pia)),h('td',null,money(r.pim)),h('td',null,money(r.devengado)),h('td',null,pct(r.avance))));
     detail=h('div',{className:'table-wrap'},h('table',{className:'finance-table'},header,body));
   }
   return h('div',{className:'finance-panel-body'},controls,head,cards,h('div',{className:'chart finance-chart'},h(BudgetChart,{rows:F.budget||[]})),downloads,detail);
 }
 renderCategories(){
   const obj=this.dataset();
   const ys=this.years();
   const year=ys.includes(+this.state.year)?+this.state.year:(ys[ys.length-1]||'');
   const metrics=['pia','pim','devengado','avance','peso'];
   const metric=metrics.includes(this.state.metric)?this.state.metric:'devengado';
   const items=Object.keys(obj).map(name=>({name,row:rowForYear(obj[name],year)}));
   const firstLabel=this.state.mode==='dest'?'Función':(this.state.kind==='source'?'Fuente de financiamiento':'Rubro presupuestal');
   const table=[[firstLabel,'PIA (S/)','PIM (S/)','Devengado (S/)','Avance (%)','% del gasto total']];
   items.forEach(it=>table.push([it.name,it.row?.pia??'',it.row?.pim??'',it.row?.devengado??'',it.row?.avance??'',it.row?.peso??'']));
   const groupName=this.state.mode==='dest'?'Funciones':(this.state.kind==='source'?'Fuentes':'Rubros');
   const base=FILE_PREFIX+'_Finanzas_'+groupName+'_'+year+'_'+metricLabel(metric).replace(/[^A-Za-z0-9]+/g,'_');
   const label=this.state.mode==='dest'?'Función del gasto':(this.state.kind==='source'?'Fuente de financiamiento':'Rubro presupuestal');
   const title=this.state.mode==='dest'?'Destino del gasto':(this.state.kind==='source'?'Todas las fuentes de financiamiento':'Todos los rubros presupuestales');
   const controls=h('div',{className:'finance-control-row'},
      h('div',{className:'field'},h('label',null,'Año a consultar'),h('select',{value:year,onChange:e=>this.setState({year:+e.target.value})},ys.map(y=>h('option',{key:y,value:y},y)))),
      h('div',{className:'field'},h('label',null,'¿Qué quieres ver?'),h('select',{value:metric,onChange:e=>this.setState({metric:e.target.value})},metrics.map(m=>h('option',{key:m,value:m},metricLabel(m)))))
   );
   const head=h('div',{className:'finance-head'},h('div',null,h('div',{className:'eyebrow'},label),h('h3',null,title)),h('div',{className:'finance-kpis'},h('span',null,'Año seleccionado: ',h('b',null,year))));
   const explain=this.state.mode==='origin'?h('p',{className:'finance-explain'},h('b',null,'Fuente de financiamiento'),' = grandes orígenes del dinero. ',h('b',null,'Rubro'),' = detalle específico dentro de esos orígenes.'):null;
   const cards=h('div',{className:'finance-category-grid'},items.map(it=>h('div',{className:'finance-category-card',key:it.name},h('span',null,it.name),h('strong',null,metricFmt(metric,metricValue(it.row,metric))),h('small',null,it.row?'Disponible en '+year:'Sin dato en '+year))));
   const downloads=h('div',{className:'download-actions'},
      h('button',{onClick:()=>xlsx(table,base+'.xlsx')},'Descargar tabla Excel'),
      h('button',{onClick:()=>csv(table,base+'.csv')},'CSV'),
      h('button',{onClick:()=>downloadPng(document.getElementById('financeChart'),base+'.png')},'Descargar gráfico PNG'),
      h('button',{onClick:()=>downloadSvg(document.getElementById('financeChart'),base+'.svg')},'SVG')
   );
   const header=h('thead',null,h('tr',null,table[0].map(x=>h('th',{key:x},x))));
   const body=h('tbody',null,items.map(it=>h('tr',{key:it.name},h('td',null,it.name),h('td',null,money(it.row?.pia)),h('td',null,money(it.row?.pim)),h('td',null,money(it.row?.devengado)),h('td',null,pct(it.row?.avance)),h('td',null,pct(it.row?.peso)))));
   const detail=h('div',{className:'table-wrap'},h('table',{className:'finance-table'},header,body));
   return h('div',{className:'finance-panel-body'},controls,head,explain,cards,h('div',{className:'chart finance-chart finance-category-chart'},h(CategoryChart,{items,metric,year})),downloads,detail);
 }
 render(){const tabs=h('div',{className:'finance-tabs'},h('button',{className:this.state.mode==='budget'?'active':'',onClick:()=>this.setMode('budget')},'Presupuesto general'),h('button',{className:this.state.mode==='origin'?'active':'',onClick:()=>this.setMode('origin')},'Origen de los recursos'),h('button',{className:this.state.mode==='dest'?'active':'',onClick:()=>this.setMode('dest')},'Destino del gasto'));const subtabs=this.state.mode==='origin'?h('div',{className:'subtabs'},h('button',{className:this.state.kind==='source'?'active':'',onClick:()=>this.setKind('source')},'Fuente de financiamiento'),h('button',{className:this.state.kind==='rubro'?'active':'',onClick:()=>this.setKind('rubro')},'Rubro presupuestal')):null;return h('div',{className:'finance-explorer'},tabs,subtabs,this.state.mode==='budget'?this.renderBudget():this.renderCategories(),h('p',{className:'technical'},'Fuente: ',F.source,' · Cobertura: ',F.period||'según disponibilidad','.'))}
}
const root=document.getElementById('financeReactRoot');if(root){attachGeneralButton();try{ReactDOM.render(h(FinanceApp),root)}catch(err){console.error('No se pudo cargar Finanzas Públicas:',err);root.innerHTML='<div class="finance-empty">No se pudo cargar el explorador de Finanzas Públicas. Recarga la página.</div>'}}
})();