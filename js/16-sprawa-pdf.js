/* Odczyt sprawy z PDF lub zdjęcia */
/* ---------- sprawa z PDF ---------- */
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Nie udało się wczytać '+src));document.head.appendChild(s)})}
async function pdfToImages(file,max,onp){
 if(!window.pdfjsLib){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js')}
 const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 const n=Math.min(pdf.numPages,max),out=[];
 for(let i=1;i<=n;i++){onp&&onp(`Przygotowuję stronę ${i} z ${n}…`);const pg=await pdf.getPage(i);const vp0=pg.getViewport({scale:1});const vp=pg.getViewport({scale:1500/vp0.width});const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;out.push(await new Promise(r=>cv.toBlob(r,'image/jpeg',0.8)))}
 return {imgs:out,total:pdf.numPages};
}
const CASE_PROMPT=()=>`Na obrazach są strony akt sprawy o zasiłek (polskie formularze ZUS, np. wniosek ZAM, zaświadczenie płatnika Z-3/Z-3a, wniosek o urlop, odpis aktu urodzenia, decyzja ZUS). Odczytaj dane i zwróć WYŁĄCZNIE JSON:
{"rodzaj_sprawy": krótki opis, "imie": imię wnioskodawcy lub null, "rola": "mama"|"tata"|"adop_k"|"adop_m"|"zast_k"|"zast_m"|null, "forma": "uop"|"zlecenie"|"jdg"|"brak"|null, "platnik": nazwa lub null, "platnik_ponad_20": true|false|null, "ubezpieczenie_od": "YYYY-MM-DD"|null, "umowa_do": "YYYY-MM-DD"|null, "ubezpieczony_w_dniu_porodu": true|false|null, "data_porodu": "YYYY-MM-DD"|null, "liczba_dzieci": liczba|null, "hospitalizacja": "nie"|"wczesniak"|"hosp"|null, "martwe_urodzenie": true|false, "okres_od": "YYYY-MM-DD"|null, "okres_do": "YYYY-MM-DD"|null, "rodzaj_zasilku": tekst|null, "wariant_815": true|false|null, "etat_przy_laczeniu": 0.25|0.5|null, "wynagrodzenia": [kwoty brutto z kolejnych miesięcy, liczby], "podstawa_wymiaru": liczba|null, "decyzja_zus": "przyznano"|"odmowa"|"brak", "uzasadnienie_decyzji": krótko|null, "dokumenty": [nazwy dokumentów widocznych w aktach], "uwagi": krótko}
Nie zgaduj: gdy czegoś nie widać, wpisz null. Dzisiaj jest ${TODAY}.`;
function caseCalc(x){
 const w=(x.wynagrodzenia||[]).map(Number).filter(v=>v>0);
 const avg=w.length?w.reduce((a,b)=>a+b,0)/w.length:null;
 const podst=x.podstawa_wymiaru?+x.podstawa_wymiaru:avg?avg*(1-CFG.skladki/100):null;
 return {avg,podst};
}
function renderSprawa(){
const r=S.caseRes;
$('#app').innerHTML=page('Sprawa z PDF',`<p class="lead">Wgraj skan wniosku lub akt sprawy (PDF albo zdjęcie). Asystent odczyta dane, sprawdzi ubezpieczenie i policzy zasiłek z indywidualnej podstawy. Dane możesz potem przenieść do formularza.</p>
<div class="cols"><div><label class="drop" for="cf"><input type="file" id="cf" accept="application/pdf,image/jpeg,image/png,image/webp"><strong>Wybierz plik</strong><span class="note">PDF, JPG lub PNG. Pliki ze zbioru konkursowego służą tylko do testów w ramach HackNation.</span></label><div class="row" style="margin-top:10px"><button class="btn y" id="can" disabled>Analizuj</button><button class="btn" id="cstop" hidden>Stop</button></div><p class="note" id="cst"></p><div class="thumbs" id="cth"></div></div>
<aside class="zcard"><h3>Jak to działa</h3><ul class="facts"><li>Strony PDF są zamieniane na obrazy w Twojej przeglądarce.</li><li>Model AI (OpenRouter albo Claude na claude.ai) odczytuje z nich dane. Wybierz model obsługujący obrazy.</li><li>Uprawnienia i kwoty liczy silnik reguł aplikacji.</li></ul></aside></div>
<div id="cres">${r?caseResHTML(r):''}</div>`);
let file=null;
$('#cf').onchange=e=>{file=e.target.files[0]||null;$('#can').disabled=!file;$('#cst').textContent=file?file.name:''};
$('#can').onclick=async()=>{if(!file)return;const st=t=>{const el=$('#cst');if(el)el.textContent=t};
 if(!LLM){st('Odczyt dokumentów wymaga modelu AI: wpisz klucz OpenRouter w zakładce „Asystent AI” (Ustawienia AI).');return}
 let lim=null;try{lim=await LLM.limits()}catch(e){}
 if(!lim||!lim.images){st('W tym widoku nie można wysyłać obrazów do Claude.');return}
 const max=Math.min(lim.images.maxCount||5,10);
 $('#can').disabled=true;const ctl=new AbortController();$('#cstop').hidden=false;$('#cstop').onclick=()=>ctl.abort();
 try{let imgs,total=1;
  if(file.type==='application/pdf'){st('Wczytuję PDF…');const o=await pdfToImages(file,max,st);imgs=o.imgs;total=o.total}else imgs=[file];
  $('#cth').innerHTML=imgs.map(b=>`<img alt="" src="${URL.createObjectURL(b)}">`).join('');
  st(`Odczytuję ${imgs.length} ${imgs.length===1?'stronę':'stron'}${total>imgs.length?` (z ${total}; analizuję pierwsze ${imgs.length})`:''}… to może potrwać do minuty.`);
  const x=await LLM.json(CASE_PROMPT(),{images:imgs,modelTier:'default',signal:ctl.signal,cache:false});
  if(!x||typeof x!=='object')throw {code:'invalid_json'};
  S.caseRes={x,file:file.name,pages:imgs.length,total};st('Gotowe.');$('#cres').innerHTML=caseResHTML(S.caseRes);bindCase()}
 catch(e){st(e&&e.code==='cancelled'?'Przerwano.':e&&e.code==='not_granted'?'Bez zgody na użycie Claude nie odczytam dokumentu.':e&&e.code==='image_rejected'?'Ten plik nie nadaje się do odczytu. Spróbuj innego.':'Nie udało się odczytać dokumentu'+(e&&e.message?': '+e.message:'.'))}
 if($('#can')){$('#can').disabled=false;$('#cstop').hidden=true}};
if(r)bindCase();
}
function caseResHTML(r){
 const x=r.x,k=caseCalc(x);
 const ok=x.ubezpieczony_w_dniu_porodu,rows=[['Rodzaj sprawy',x.rodzaj_sprawy],['Wnioskodawca',x.imie],['Rola',x.rola],['Forma ubezpieczenia',FORMA[x.forma]||x.forma],['Płatnik',x.platnik],['Płatnik > 20 osób',x.platnik_ponad_20==null?null:x.platnik_ponad_20?'tak':'nie'],['Ubezpieczenie od',x.ubezpieczenie_od&&fmt(x.ubezpieczenie_od)],['Data porodu',x.data_porodu&&fmt(x.data_porodu)],['Liczba dzieci',x.liczba_dzieci],['Hospitalizacja',x.hospitalizacja],['Okres wniosku',x.okres_od?fmt(x.okres_od)+' – '+(x.okres_do?fmt(x.okres_do):'…'):null],['Rodzaj zasiłku',x.rodzaj_zasilku],['Decyzja ZUS w aktach',x.decyzja_zus],['Uzasadnienie',x.uzasadnienie_decyzji],['Dokumenty',(x.dokumenty||[]).join(', ')],['Uwagi',x.uwagi]];
 const pct=x.wariant_815?CFG.st815:null;
 return `<h3 class="h">Wynik odczytu: ${esc(r.file)}</h3>
<div class="hero ${ok===false?'bad':'okb'}"><h3>${ok===true?'Ubezpieczenie chorobowe w dniu porodu: tak':ok===false?'W dniu porodu brak ubezpieczenia chorobowego: zasiłek nie przysługuje (R01)':'Nie udało się ustalić ubezpieczenia w dniu porodu'}</h3>${x.decyzja_zus&&x.decyzja_zus!=='brak'?`<div class="kv"><span>Decyzja w aktach: ${esc(x.decyzja_zus)}</span></div>`:''}</div>
<div class="cols"><div><table class="stack"><tbody>${rows.filter(r=>r[1]!=null&&r[1]!=='').map(r=>`<tr><td data-l="Pole">${esc(r[0])}</td><td data-l="Wartość">${esc(r[1])}</td></tr>`).join('')}</tbody></table></div>
<aside class="zcard"><h3>Kalkulator z indywidualną podstawą</h3>${k.podst?`<ul class="facts kv2">${k.avg?`<li><span>Średnie wynagrodzenie (${(x.wynagrodzenia||[]).length} mies.)</span><strong>${zl(k.avg)}</strong></li>`:''}<li><span>Podstawa wymiaru</span><strong>${zl(k.podst)}</strong></li><li><span>${CFG.stMac}% (macierzyński)</span><strong>${zl(Math.max(k.podst,0)*CFG.stMac/100)}</strong></li><li><span>${CFG.stRodz}% (rodzicielski)</span><strong>${zl(k.podst*CFG.stRodz/100)}</strong></li><li><span>${pc(CFG.st815)}% (wariant jednolity)</span><strong>${zl(k.podst*CFG.st815/100)}</strong></li></ul><p class="note">Kwoty miesięczne, orientacyjnie${pct?'; w aktach wybrano wariant '+pc(pct)+'%':''}.</p>`:'<p class="note">Nie odczytano wynagrodzeń ani podstawy wymiaru.</p>'}<button class="btn pri" id="cuse">Przenieś do formularza</button></aside></div>`;
}
function bindCase(){const b=$('#cuse');if(!b)return;b.onclick=()=>{const x=S.caseRes.x,k=caseCalc(x);
 const p={id:'case',tag:'sprawa z PDF',zus:{forma:x.forma||null,platnik:x.platnik||'—',ponad20:x.platnik_ponad_20,od:x.ubezpieczenie_od,koniec:x.umowa_do,dobr:true,brutto:k.avg||(k.podst?k.podst/(1-CFG.skladki/100):0),zadl:0,wzrost:false},dane:{imie:x.imie||'Wnioskodawca',nazwisko:'',pesel:'(z dokumentu)',adres:'—',konto:'—'},opis:'Dane odczytane z dokumentu',ezla:[]};
 if(!p.zus.forma)p.manual=true;
 const A={};if(x.rola)A.rola=x.rola;if(!p.manual)A.zus_ok=true;
 if(x.data_porodu){A.etap='po';A.data_porodu=x.data_porodu}
 if(x.liczba_dzieci)A.liczba=String(Math.min(5,+x.liczba_dzieci));
 if(x.martwe_urodzenie){A.spec_open=true;A.spec='martwe'}
 else if(x.hospitalizacja)A.hosp=x.hospitalizacja;
 if(x.wariant_815!=null)A.w815=x.wariant_815?'815':'100_70';
 if(x.etat_przy_laczeniu)A.laczenie=String(x.etat_przy_laczeniu);
 S={...fresh(),p,view:'form',tab:'wynik',m:'panel',A,order:Object.keys(A),caseRes:S.caseRes};
 for(const k2 of Object.keys(A))S.auto[k2]=1;
 render()}}
