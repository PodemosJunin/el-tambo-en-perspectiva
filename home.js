document.addEventListener('DOMContentLoaded',()=>{
 const {byId,fmt,years}=JP;
 const latest=i=>{const ys=years(i),y=ys[ys.length-1];return [y,Number(i.values[y])]};
 const aulas=byId('aulas_buen_estado'),internet=byId('internet'),anemia=byId('anemia_oms');
 const [ya,va]=latest(aulas),[yi,vi]=latest(internet),[yan,van]=latest(anemia);
 const hero=[{value:fmt(aulas,va,1),text:'locales escolares públicos con todas sus aulas en buen estado · '+ya},{value:(100-vi).toLocaleString('es-PE',{maximumFractionDigits:1})+'%',text:'colegios de primaria y secundaria sin acceso a internet · '+yi},{value:fmt(anemia,van,1),text:'anemia en niñas y niños de 6 a 35 meses · criterio OMS 2024 · '+yan}];
 document.querySelector('#heroMetrics').innerHTML=hero.map(x=>`<div class="hero-metric"><strong>${x.value}</strong><span>${x.text}</span></div>`).join('');
 const defs=['viviendas_agua_red','viviendas_saneamiento_red','viviendas_alumbrado_red'];const titles={viviendas_agua_red:'Agua por red pública domiciliaria',viviendas_saneamiento_red:'Saneamiento por red pública',viviendas_alumbrado_red:'Alumbrado eléctrico por red pública'};
 document.querySelector('#resultsGrid').innerHTML=defs.map(id=>{const i=byId(id),ys=years(i),y=ys[ys.length-1],v=Number(i.values[y]);return `<article class="result-item"><div class="eyebrow">Censo ${y}</div><div class="result-number">${fmt(i,v,1)}</div><h3>${titles[id]}</h3><p>Viviendas de El Tambo con acceso al servicio según el último corte censal disponible.</p><div class="source-mini">Fuente: ${i.source}</div></article>`}).join('');
});