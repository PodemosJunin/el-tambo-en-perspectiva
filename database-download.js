(function(){
'use strict';
const CFG=window.DB_DOWNLOAD_CONFIG||{};
const D=window.OBS_DATA||{indicators:[]};
const order=['Social','Económica','Ambiental','Institucional'];
const dimLabels={'Social':'Social','Económica':'Económica','Ambiental':'Ambiental','Institucional':'Institucional'};
function safeName(s){return String(s||'datos').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,90)||'datos'}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function col(n){let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}
function cell(v,c,r){const ref=col(c)+r;if(typeof v==='number'&&Number.isFinite(v))return `<c r="${ref}" t="n"><v>${v}</v></c>`;return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`}
function rowsForDimension(dim){
 const rows=[['Dimensión','Componente','ID','Indicador','Indicador técnico','Año','Valor','Unidad','Fuente','Nota','PROXY']];
 (D.indicators||[]).filter(i=>i.dimension===dim).forEach(i=>{
   const vals=i.values||{}; const ys=Object.keys(vals).sort((a,b)=>Number(a)-Number(b));
   if(!ys.length) rows.push([dim,i.section||'',i.id||'',i.citizen||'',i.technical||'', '', '',i.unit||'',i.source||'',i.note||'',i.proxy?'Sí':'No']);
   ys.forEach(y=>rows.push([dim,i.section||'',i.id||'',i.citizen||'',i.technical||'',Number(y),vals[y],i.unit||'',i.source||'',i.note||'',i.proxy?'Sí':'No']));
 });
 return rows;
}
function metadataRows(){
 const rows=[['Ámbito','Nivel territorial','Dimensión','Componente','ID','Indicador','Indicador técnico','Unidad','Sentido favorable','Fuente','Años disponibles','Nota','PROXY']];
 (D.indicators||[]).forEach(i=>{const ys=Object.keys(i.values||{}).sort((a,b)=>Number(a)-Number(b));rows.push([CFG.scope||'',CFG.level||'',i.dimension||'',i.section||'',i.id||'',i.citizen||'',i.technical||'',i.unit||'',i.direction||'',i.source||'',ys.join(', '),i.note||'',i.proxy?'Sí':'No'])});
 rows.push([CFG.scope||'',CFG.level||'','Institucional','Finanzas públicas','','Finanzas Públicas','','','','MEF – Consulta Amigable','','La base presupuestal completa se descarga desde el subentorno Finanzas Públicas.','']);
 return rows;
}
async function xlsxMulti(sheets,filename){
 if(!window.JSZip){alert('No se pudo iniciar la descarga de Excel. Recarga la página.');return}
 const z=new JSZip();
 const types=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">','<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>','<Default Extension="xml" ContentType="application/xml"/>','<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'];
 sheets.forEach((_,i)=>types.push(`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`));types.push('</Types>');z.file('[Content_Types].xml',types.join(''));
 z.folder('_rels').file('.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 let wb='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>';
 let rel='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
 sheets.forEach((s,i)=>{const nm=String(s.name||('Hoja '+(i+1))).replace(/[\\\/?*\[\]:]/g,' ').slice(0,31);wb+=`<sheet name="${esc(nm)}" sheetId="${i+1}" r:id="rId${i+1}"/>`;rel+=`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`});wb+='</sheets></workbook>';rel+='</Relationships>';
 z.folder('xl').file('workbook.xml',wb);z.folder('xl').folder('_rels').file('workbook.xml.rels',rel);
 sheets.forEach((s,si)=>{let body='';(s.rows||[]).forEach((row,ri)=>{body+=`<row r="${ri+1}">`;row.forEach((v,ci)=>body+=cell(v,ci+1,ri+1));body+='</row>'});const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+body+'</sheetData></worksheet>';z.folder('xl').folder('worksheets').file(`sheet${si+1}.xml`,xml)});
 const blob=await z.generateAsync({type:'blob'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)
}
function financeSheets(){
 const F=window.FIN_DATA;if(!F)return [];
 const budget=[['Año','Alcalde / periodo','PIA (S/)','PIM (S/)','Devengado (S/)','Girado (S/)','Avance (%)']].concat((F.budget||[]).map(r=>[r.year,r.gestion||'',r.pia,r.pim,r.devengado,r.girado??'',r.avance]));
 const flat=(obj,label)=>[[label,'Año','Alcalde / periodo','PIA (S/)','PIM (S/)','Devengado (S/)','Girado (S/)','Avance (%)','% del gasto total']].concat(Object.keys(obj||{}).flatMap(name=>(obj[name]||[]).map(r=>[name,r.year,r.gestion||'',r.pia,r.pim,r.devengado,r.girado??'',r.avance,r.peso??''])));
 return [{name:'05 Finanzas Presupuesto',rows:budget},{name:'06 Finanzas Fuentes',rows:flat(F.sources,'Fuente')},{name:'07 Finanzas Rubros',rows:flat(F.rubros,'Rubro')},{name:'08 Finanzas Funciones',rows:flat(F.functions,'Función')}]
}
function downloadAll(){const sheets=order.map((d,i)=>({name:String(i+1).padStart(2,'0')+' '+dimLabels[d],rows:rowsForDimension(d)}));sheets.push(...financeSheets());sheets.push({name:'09 Metadatos',rows:metadataRows()});xlsxMulti(sheets,safeName(CFG.site||CFG.scope)+'_Base_de_datos_completa.xlsx')}
function downloadDimension(dim){const rows=rowsForDimension(dim);xlsxMulti([{name:dimLabels[dim]||dim,rows}],safeName(CFG.scope)+'_Base_'+safeName(dimLabels[dim]||dim)+'.xlsx')}
function init(){document.querySelectorAll('[data-download-all]').forEach(b=>b.addEventListener('click',downloadAll));document.querySelectorAll('[data-download-dimension]').forEach(b=>b.addEventListener('click',()=>downloadDimension(b.dataset.downloadDimension)))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.DBDownload={downloadAll,downloadDimension,rowsForDimension};
})();
