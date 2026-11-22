/* Generowanie wniosku do pobrania (.docx, .html) */
/* ---------- pobieranie wniosku ---------- */
let DL=null;
(async()=>{try{if(window.claude&&window.claude.use)DL=await window.claude.use('downloads')}catch(e){DL=null}})();
async function saveFile(name,blob){
 if(DL){try{await DL.save({filename:name,data:blob});return 'ok'}catch(e){const k=e&&e.code;if(k==='declined')return 'declined';if(k==='rate_limited')return 'busy';if(!['unavailable','not_granted','capability_disabled','capability_removed'].includes(k))return 'error'}}
 try{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);return 'ok'}catch(e){return 'error'}
}
function wniosekDoc(R){
 const c=ctx(),A=c.A,d=c.p.dane,f=c.forma,uop=f==='uop';
 const name=c.p.manual?'':(d.imie+' '+d.nazwisko).trim();
 const ben=R.ben.filter(b=>(!b.note||b.r==='R33')&&b.r!=='R09');
 const os=[];
 if(parent(c)&&!c.spec)os.push([c.zz,'Dziecko ma zaświadczenie „Za życiem”'+(c.zz?kidList(c,k=>k.zazycie==='tak'):'')]);
 if(c.typ==='mama'&&!c.spec&&A.w815!==undefined)os.push([A.w815==='815',`Zamierzam skorzystać z pełnego wymiaru urlopu macierzyńskiego i rodzicielskiego (zasiłek ${pc(CFG.st815)}%)`+(A.w815==='niewiem'?`: do decyzji${c.birth?', najpóźniej do '+fmt(addD(c.birth,CFG.okno815)):''}`:'')]);
 if(uop&&!c.spec)os.push([A.laczenie&&A.laczenie!=='nie','Łączę urlop rodzicielski z pracą u pracodawcy'+(A.laczenie&&A.laczenie!=='nie'?` (${A.laczenie==='0.5'?'1/2':'1/4'} etatu)`:'')]);
 if(parent(c)&&A.etap==='po'&&!c.spec)os.push([c.hospAny,'Dotyczy dziecka wymagającego hospitalizacji / wcześniaka'+(c.hospAny?kidList(c,k=>k.hosp==='wczesniak'||k.hosp==='hosp'):'')]);
 const kid=[];
 if(c.typ==='adop'||c.typ==='zast'){kid.push(['Data przyjęcia dziecka',A.przyjecie?fmt(A.przyjecie):''],['Wiek dziecka',A.wiek!==undefined?A.wiek+' lat':''])}
 else if(c.n>1){kid.push(['Data urodzenia',A.data_porodu?fmt(A.data_porodu):''],['Przewidywany termin porodu',A.termin?fmt(A.termin):''],['Liczba dzieci',A.liczba||'']);
  for(const k of c.kids){if(A.etap==='po')kid.push([`Dziecko ${k.i}: imię`,k.imie,1],[`Dziecko ${k.i}: hospitalizacja`,k.hosp?KID_HOSP[k.hosp]:'']);kid.push([`Dziecko ${k.i}: zaświadczenie „Za życiem”`,k.zazycie?KID_ZZ[k.zazycie]:''])}}
 else{kid.push(['Imię dziecka',A.imie||''],['Data urodzenia',A.data_porodu?fmt(A.data_porodu):''],['Przewidywany termin porodu',A.termin?fmt(A.termin):''],['Liczba dzieci',A.liczba||''])}
 return {uop,title:R.w.name,adresat:uop?'Pracodawca: '+c.platnik:f==='zlecenie'?'Płatnik składek (zleceniodawca) albo ZUS':'Zakład Ubezpieczeń Społecznych',
  osoba:[['Imię i nazwisko',name],['Adres',c.p.manual?'':d.adres],['PESEL',c.p.manual?'':d.pesel],['Tytuł ubezpieczenia',FORMA[f]||'']],
  intro:uop?'Na podstawie przepisów Kodeksu pracy wnoszę o udzielenie mi:':'Wnoszę o wypłatę zasiłku za okres:',
  lines:ben.map(b=>[b.n,(b.od?fmt(b.od)+' – '+(b.do?fmt(b.do):'…')+', ':'')+(b.tyg||'')]),
  kid:kid.filter(k=>k[1]!==''||k[2]).map(k=>[k[0],k[1]]),kidH:parent(c)&&c.n>1?'Dane dzieci':'Dane dziecka',os,
  drugi:(c.typ==='mama'||c.typ==='adop'||c.typ==='zast')&&A.drugi?{rodz:'tak, część rodzicielskiego'+(A.drugi_tyg?` (${A.drugi_tyg} tyg.)`:''),przej:'tak, przejmie część macierzyńskiego',nie:'nie',niewiem:'jeszcze nie wiadomo'}[A.drugi]:null,
  konto:uop?null:(A.konto_ok===true?d.konto:A.konto||''),
  att:R.att.map(a=>a.t),
  when:R.w.when,
  note:uop?'Wygenerowano w prototypie „Przewodnik przyszłego rodzica” (HackNation 2026). Sprawdź dane przed złożeniem.':'Uproszczony wzór na podstawie danych z aplikacji. Do ZUS składa się oficjalny formularz ZAM (wzór na zus.pl); przepisz do niego te dane. Wygenerowano w prototypie „Przewodnik przyszłego rodzica”.'};
}
const xe=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function docxBlob(D){
 if(!window.JSZip)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
 const run=(t,o={})=>`<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${o.b?'<w:b/>':''}${o.i?'<w:i/>':''}<w:sz w:val="${o.sz||22}"/>${o.col?`<w:color w:val="${o.col}"/>`:''}</w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
 const P=(t,o={})=>`<w:p><w:pPr>${o.jc?`<w:jc w:val="${o.jc}"/>`:''}<w:spacing w:before="${o.before||0}" w:after="${o.after??80}"/></w:pPr>${Array.isArray(t)?t.join(''):run(t,o)}</w:p>`;
 const cell=(t,w,o={})=>`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/></w:tcPr>${P(t,{...o,after:40})}</w:tc>`;
 const tbl=rows=>rows.length?`<w:tbl><w:tblPr><w:tblW w:w="9300" w:type="dxa"/><w:tblBorders><w:insideH w:val="single" w:sz="4" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="4" w:color="CCCCCC"/><w:top w:val="single" w:sz="4" w:color="CCCCCC"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="3400"/><w:gridCol w:w="5900"/></w:tblGrid>${rows.map(r=>`<w:tr>${cell(r[0],3400,{col:'555555'})}${cell(r[1]||'……………………',5900,{b:!!r[1]})}</w:tr>`).join('')}</w:tbl>`:'';
 const H=t=>P(t,{b:true,sz:24,col:'0A6C36',before:200,after:80});
 let b='';
 b+=P('……………………, dnia '+fmt(TODAY),{jc:'right'});
 b+=P(D.adresat,{jc:'right',b:true,before:120});
 b+=P(D.title.toUpperCase(),{jc:'center',b:true,sz:30,before:300,after:200});
 b+=H('Wnioskodawca')+tbl(D.osoba);
 b+=H(D.intro)+tbl(D.lines);
 if(D.kid.length)b+=H(D.kidH)+tbl(D.kid);
 if(D.os.length)b+=H('Oświadczenia')+D.os.map(o=>P((o[0]?'☒ ':'☐ ')+o[1])).join('');
 if(D.drugi)b+=H('Drugi rodzic')+tbl([['Korzysta z urlopu',D.drugi]]);
 if(D.konto!==null)b+=H('Wypłata')+tbl([['Rachunek bankowy',D.konto]]);
 if(D.att.length)b+=H('Załączniki')+D.att.map((a,i)=>P(`${i+1}. ${a}`)).join('');
 b+=P('……………………………………',{jc:'right',before:600,after:0})+P('podpis wnioskodawcy',{jc:'right',sz:18,col:'555555'});
 b+=P(D.when,{i:true,sz:18,col:'555555',before:300})+P(D.note,{i:true,sz:18,col:'555555'});
 const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${b}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
 const z=new window.JSZip();
 z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 z.file('word/document.xml',doc);
 return z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
function htmlBlob(D){
 const T=rows=>rows.length?`<table>${rows.map(r=>`<tr><th>${xe(r[0])}</th><td>${r[1]?xe(r[1]):'<span class="e">……………………</span>'}</td></tr>`).join('')}</table>`:'';
 const h=`<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><title>${xe(D.title)}</title><style>body{font:15px/1.5 Arial,sans-serif;color:#1b1b1b;max-width:760px;margin:32px auto;padding:0 24px}h1{text-align:center;font-size:22px;margin:28px 0 18px;text-transform:uppercase}h2{font-size:15px;color:#0a6c36;margin:20px 0 6px}.r{text-align:right}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #ccc;vertical-align:top}th{width:36%;color:#555;font-weight:400}td{font-weight:700}.e{color:#999;font-weight:400}.sig{margin-top:60px;text-align:right}.n{font-size:12px;color:#555;font-style:italic;margin-top:28px}@media print{.no{display:none}body{margin:0}}</style></head><body>
<p class="no" style="background:#e9f4ed;padding:10px;border-radius:4px">Aby zapisać jako PDF: Plik → Drukuj → „Zapisz jako PDF”.</p>
<p class="r">……………………, dnia ${fmt(TODAY)}</p><p class="r"><b>${xe(D.adresat)}</b></p><h1>${xe(D.title)}</h1>
<h2>Wnioskodawca</h2>${T(D.osoba)}<h2>${xe(D.intro)}</h2>${T(D.lines)}${D.kid.length?'<h2>'+xe(D.kidH)+'</h2>'+T(D.kid):''}${D.os.length?'<h2>Oświadczenia</h2>'+D.os.map(o=>`<p>${o[0]?'☒':'☐'} ${xe(o[1])}</p>`).join(''):''}${D.drugi?'<h2>Drugi rodzic</h2>'+T([['Korzysta z urlopu',D.drugi]]):''}${D.konto!==null?'<h2>Wypłata</h2>'+T([['Rachunek bankowy',D.konto]]):''}${D.att.length?'<h2>Załączniki</h2><ol>'+D.att.map(a=>`<li>${xe(a)}</li>`).join('')+'</ol>':''}
<p class="sig">……………………………………<br><small>podpis wnioskodawcy</small></p><p class="n">${xe(D.when)}<br>${xe(D.note)}</p></body></html>`;
 return new Blob([h],{type:'text/html'});
}
const fileBase=D=>D.title.replace(/^ZAM: /,'ZAM ').replace(/[^\p{L}\p{N}]+/gu,'_').replace(/^_|_$/g,'').slice(0,90);
async function downloadWniosek(kind,msgEl){
 const R=compute();if(!R.w)return;
 const D=wniosekDoc(R);const say=t=>{if(msgEl)msgEl.textContent=t};
 say('Przygotowuję plik…');
 try{const blob=kind==='docx'?await docxBlob(D):htmlBlob(D);
  const r=await saveFile(fileBase(D)+'.'+kind,blob);
  say(r==='ok'?'Plik gotowy.':r==='declined'?'Pobieranie anulowane.':r==='busy'?'Okno zapisu jest już otwarte.':'Nie udało się pobrać pliku.')}
 catch(e){say('Nie udało się przygotować pliku'+(e&&e.message?': '+e.message:'.'))}
}
const dlButtons=()=>`<button class="btn" data-dl="docx">Pobierz wniosek (.docx)</button><button class="btn" data-dl="html">Pobierz do druku / PDF (.html)</button><span class="note" data-dlmsg></span>`;
function bindDl(){document.querySelectorAll('[data-dl]').forEach(b=>b.onclick=()=>downloadWniosek(b.dataset.dl,b.parentElement.querySelector('[data-dlmsg]')))}
