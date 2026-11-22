/* Zadłużenie w składkach na dzień powstania prawa i zaświadczenie */
/* ---------- zadłużenie w składkach ---------- */
const FUNDS=[['emerytalne',19.52],['rentowe',8],['chorobowe',2.45],['wypadkowe',1.67]];
const mies=s=>D(s).toLocaleDateString('pl-PL',{month:'2-digit',year:'numeric'});
const zlTxt=n=>new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+' zł';
/* pozycje zaległości z ZUS: z rejestru profilu albo jedna pozycja z kwoty łącznej */
function zadlLedger(c){if(c.man||!c.z)return null;const z=c.z;if(z.zadlPoz)return z.zadlPoz;return z.zadl>0?[{okres:addD(TODAY,-50),termin:addD(TODAY,-30),kwota:z.zadl}]:[]}
/* stan zadłużenia na wskazany dzień: zaległe (po terminie płatności) i niespłacone pozycje + odsetki za zwłokę */
function debtOn(c,d){
 const L=zadlLedger(c);if(!L||!d)return null;
 const paid=S.zadlSplata&&diff(S.zadlSplata,d)>=0;
 const items=L.filter(x=>diff(x.termin,d)>0&&!paid).map(x=>{const dni=diff(x.termin,d);let ods=Math.round(x.kwota*CFG.odsetki/100*dni/365);if(ods<CFG.odsMin)ods=0;const tw=FUNDS.reduce((a,f)=>a+f[1],0);return {...x,dni,ods,fund:FUNDS.map(f=>[f[0],Math.round(x.kwota*f[1]/tw*100)/100])}});
 const glowna=items.reduce((a,x)=>a+x.kwota,0),ods=items.reduce((a,x)=>a+x.ods,0),razem=glowna+ods,prog=Math.round(CFG.minWyn*CFG.progZadl)/100;
 return {d,items,glowna,ods,razem,prog,ponad:razem>prog,przyszlosc:diff(TODAY,d)>0}}
/* dni powstania prawa do świadczeń, dla których liczymy stan zadłużenia */
function dniPrawa(c,R){
 const out=[];
 if(c.ezlaNow&&c.typ==='mama')out.push({n:'Zasiłek chorobowy (e-ZLA)',d:c.ezlaNow.od});
 const main=R.ben.find(b=>b.od&&!b.note&&b.r!=='R09');
 const d=main?main.od:(c.birth||c.A.przyjecie||null);
 if(d)out.push({n:main?main.n:'Zasiłek macierzyński',d});
 return out}
function zadlHTML(R){
 const c=ctx();if(c.forma!=='jdg'||R.blocked)return '';
 let h=`<h3 class="h">Zadłużenie w składkach na dzień powstania prawa do zasiłku <span class="rid">R05</span></h3>`;
 if(c.man)return h+`<p class="note">Bez danych z ZUS nie mogę sprawdzić zadłużenia. Sprawdź saldo w eZUS (zakładka „Płatnik”) przed złożeniem wniosku.</p>`;
 const dp=R.dniPrawa||[];
 if(!dp.length)return h+`<p class="note">Stan zadłużenia policzę, gdy będzie znany dzień rozpoczęcia zasiłku (termin porodu lub data porodu).</p>`;
 h+=`<p class="note">Przy działalności ZUS sprawdza, czy na dzień powstania prawa do zasiłku masz zaległe składki na ubezpieczenia społeczne. Dane pochodzą z symulowanego konta płatnika.</p>`;
 h+=`<table class="stack"><thead><tr><th>Świadczenie</th><th>Dzień powstania prawa</th><th style="text-align:right">Zadłużenie</th><th>Status</th><th></th></tr></thead><tbody>${dp.map((p,i)=>{const s=debtOn(c,p.d);return `<tr><td data-l="Świadczenie">${esc(p.n)}</td><td data-l="Dzień" class="nw">${fmt(p.d)}${s.przyszlosc?'<br><span class="note">prognoza</span>':''}</td><td data-l="Zadłużenie" class="n">${zlTxt(s.razem)}${s.ods?`<br><span class="note">w tym odsetki ${zlTxt(s.ods)}</span>`:''}</td><td data-l="Status">${s.razem===0?'<span class="okmsg">brak zadłużenia</span>':s.ponad?'<strong style="color:var(--red)">do spłaty</strong>':'poniżej progu'}</td><td data-l=""><button class="btn sm" data-zasw="${i}">Wystaw zaświadczenie</button></td></tr>`}).join('')}</tbody></table>`;
 const now=debtOn(c,TODAY);
 if(now.razem>0)h+=`<div class="acts"><button class="btn y" id="zsplac">Opłać zadłużenie ${zlTxt(now.razem)} </button><span class="note">Spłata dziś wyzeruje zadłużenie na późniejsze dni powstania prawa.</span></div>`;
 else if(S.zadlSplata)h+=`<p class="okmsg">Zadłużenie opłacone ${fmt(S.zadlSplata)}.</p>`;
 h+=`<p class="note">Odsetki za zwłokę liczone szacunkowo (${String(CFG.odsetki).replace('.',',')}% rocznie, od dnia po terminie płatności; kwoty poniżej ${zlTxt(CFG.odsMin)} pomijane). Próg ${String(CFG.progZadl).replace('.',',')}% minimalnego wynagrodzenia = ${zlTxt(Math.round(CFG.minWyn*CFG.progZadl)/100)}. Parametry do potwierdzenia z ZUS.</p>`;
 if(S.zadlZasw.length)h+=`<h3 class="h">Wystawione zaświadczenia </h3><ul class="list">${S.zadlZasw.map((z,i)=>`<li><strong>${esc(z.nr)}</strong>, wystawione ${fmt(z.wyst)}: stan na ${fmt(z.d)} (${esc(z.n)}): <strong>${zlTxt(z.s.razem)}</strong><div class="acts"><button class="btn sm" data-zdl="${i}">Pobierz zaświadczenie (.html)</button><span class="note" data-dlmsg></span></div></li>`).join('')}</ul>`;
 return h}
function zaswHTML(z){
 const c=ctx(),d=c.p.dane,s=z.s;
 const fh=FUNDS.map(f=>`<th>${f[0]}</th>`).join('');
 const rows=s.items.map(x=>`<tr><td>${mies(x.okres)}</td><td>${fmt(x.termin)}</td>${x.fund.map(f=>`<td class="n">${zlTxt(f[1])}</td>`).join('')}<td class="n">${zlTxt(x.kwota)}</td><td class="n">${zlTxt(x.ods)}</td></tr>`).join('');
 return `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><title>Zaświadczenie o stanie zadłużenia </title><style>body{font:14px/1.5 Arial,sans-serif;color:#1b1b1b;max-width:820px;margin:32px auto;padding:0 24px;position:relative}h1{font-size:19px;text-align:center;margin:24px 0 16px}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #bbb;padding:5px 7px;text-align:left;vertical-align:top}th{background:#f1f1f1;font-weight:600}.n{text-align:right;white-space:nowrap}.r{text-align:right}.wm{position:fixed;top:40%;left:0;right:0;text-align:center;font-size:90px;color:rgba(200,0,0,.08);transform:rotate(-20deg);pointer-events:none;font-weight:700}.box{border:2px solid #0a6c36;padding:10px 14px;margin:14px 0;font-weight:700}.n2{font-size:12px;color:#555;font-style:italic;margin-top:28px}</style></head><body><div class="wm"></div>
<p class="r">Wystawiono: ${fmt(z.wyst)}<br>Nr: ${xe(z.nr)}</p>
<h1>ZAŚWIADCZENIE O STANIE ZADŁUŻENIA Z TYTUŁU SKŁADEK<br>NA UBEZPIECZENIA SPOŁECZNE</h1>
<table><tr><th style="width:38%">Płatnik / ubezpieczony</th><td>${xe((d.imie+' '+d.nazwisko).trim())}</td></tr><tr><th>PESEL</th><td>${xe(d.pesel)}</td></tr><tr><th>Działalność</th><td>${xe(c.platnik)}</td></tr><tr><th>Stan na dzień</th><td><b>${fmt(z.d)}</b> (dzień powstania prawa: ${xe(z.n)})</td></tr></table>
${s.items.length?`<p>Zaległe składki na ubezpieczenia społeczne:</p><table><tr><th>Okres</th><th>Termin płatności</th>${fh}<th>Należność główna</th><th>Odsetki</th></tr>${rows}<tr><th colspan="${2+FUNDS.length}">Razem</th><th class="n">${zlTxt(s.glowna)}</th><th class="n">${zlTxt(s.ods)}</th></tr></table><div class="box">Łączne zadłużenie na dzień ${fmt(z.d)}: ${zlTxt(s.razem)}</div>`:`<div class="box">Na dzień ${fmt(z.d)} brak zaległości z tytułu składek na ubezpieczenia społeczne.</div>`}
${s.przyszlosc?'<p>Stan na dzień przyszły jest prognozą: zakłada, że składki za kolejne miesiące zostaną opłacone w terminie, a obecne zaległości nie.</p>':''}
<p class="n2">Dokument wygenerowany w prototypie „Przewodnik przyszłego rodzica” (HackNation 2026) na podstawie zmyślonych danych. Nie jest zaświadczeniem wydanym przez ZUS. Odsetki szacunkowe (${String(CFG.odsetki).replace('.',',')}% rocznie).</p></body></html>`}
function bindZadl(R){
 const c=ctx();
 document.querySelectorAll('[data-zasw]').forEach(b=>b.onclick=()=>{const p=(R.dniPrawa||[])[+b.dataset.zasw];if(!p)return;S.zadlZasw.push({nr:'SYM-ZAD/'+new Date().getFullYear()+'/'+String(Math.floor(10000+Math.random()*90000)),wyst:TODAY,d:p.d,n:p.n,s:debtOn(c,p.d)});rerender()});
 document.querySelectorAll('[data-zdl]').forEach(b=>b.onclick=async()=>{const z=S.zadlZasw[+b.dataset.zdl],m=b.parentElement.querySelector('[data-dlmsg]');const r=await saveFile('Zaswiadczenie_zadluzenie_'+z.d+'.html',new Blob([zaswHTML(z)],{type:'text/html'}));if(m)m.textContent=r==='ok'?'Plik gotowy.':'Nie udało się pobrać pliku.'});
 if($('#zsplac'))$('#zsplac').onclick=()=>{S.zadlSplata=TODAY;rerender()};
}
const rerender=()=>{if(S.view==='dokumenty')renderDokumenty();else renderWork()};
