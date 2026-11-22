/* Panel obok czatu: wniosek, wynik, profil, reguły */
function fld(l,v,miss){return `<div class="fld"><div class="l">${esc(l)}</div><div class="v ${v?'done':'miss'}">${v?esc(v):esc(miss||'uzupełni rozmowa')}</div></div>`}
function cb(on,t){return `<div class="cb"><span class="box">${on?'✕':''}</span>${esc(t)}</div>`}

function panelWniosek(R){
const c=ctx(),A=c.A,d=c.p.dane;
if(R.blocked)return `<div class="sheet"><div class="hd"><h2>Brak wniosku do złożenia</h2><div class="to">Sytuacja na dziś</div></div><p>${esc(R.blocked)}</p><p class="note">Szczegóły i dalsze kroki są w zakładce „Wynik”.</p></div>`;
const f=c.forma,uop=f==='uop';
const main=R.ben.find(b=>b.od&&!b.note)||R.ben[0];
const title=R.w?R.w.name:(c.typ?'Wniosek: ustalanie…':'Wniosek pojawi się w trakcie rozmowy');
const powod=c.typ==='adop'?'przyjęcie dziecka na wychowanie i wystąpienie do sądu o przysposobienie':c.typ==='zast'?'przyjęcie dziecka w ramach rodziny zastępczej niezawodowej':c.typ==='tata'&&A.mama_status&&A.mama_status!=='tak'?{szpital:'pobyt mamy dziecka w szpitalu',orzeczenie:'orzeczenie o niezdolności mamy do samodzielnej egzystencji',smierc:'śmierć mamy dziecka',porzucenie:'porzucenie dziecka przez mamę'}[A.mama_status]:c.typ?'urodzenie się dziecka':'';
const kidDate=A.data_porodu||A.przyjecie;
let h=`<div class="sheet"><div class="hd"><h2>${esc(title)}</h2><div class="to">${uop?'Adresat: pracodawca':'Formularz ZUS ZAM (wzór uproszczony)'}<br>${esc(R.w?R.w.where:'')}</div></div>`;
h+=`<div class="sec">Dane wnioskodawcy (z ZUS)</div>${fld('Imię i nazwisko',(d.imie+' '+d.nazwisko).trim()&&!c.p.manual?d.imie+' '+d.nazwisko:'')}${fld('PESEL',c.p.manual?'':d.pesel)}${fld('Adres',c.p.manual?'':d.adres)}${fld('Tytuł ubezpieczenia',f?FORMA[f]:'')}${uop?fld('Pracodawca',c.platnik):''}`;
h+=`<div class="sec">${uop?'Wnoszę o udzielenie urlopu':'Wnoszę o wypłatę zasiłku macierzyńskiego za okres'}</div>`;
if(R.ben.length){h+=R.ben.filter(b=>(!b.note||b.r==='R33')&&b.r!=='R09').map(b=>fld(b.n,(b.od?fmt(b.od)+' – '+(b.do?fmt(b.do):'…'):'')+(b.od?' · ':'')+b.tyg)).join('')}else h+=fld('Okres','');
h+=`<div class="sec">Powód</div>${fld('Wnioskuję z powodu',powod)}`;
h+=`<div class="sec">${parent(c)&&c.n>1?'Dane dzieci':'Dane dziecka'}</div>${parent(c)&&c.n>1?c.kids.map(k=>fld(`Imię dziecka ${k.i}`,k.imie,A.etap==='po'?'pominięto, uzupełnij':'po urodzeniu')+(A.etap==='po'?fld(`Dziecko ${k.i}: szpital`,k.hosp?KID_HOSP[k.hosp]:''):'')+fld(`Dziecko ${k.i}: „Za życiem”`,k.zazycie?KID_ZZ[k.zazycie]:'')).join(''):fld('Imię dziecka',A.imie||'', A.etap==='po'?'pominięto, uzupełnij':'po urodzeniu')}${fld(c.typ==='adop'||c.typ==='zast'?'Data przyjęcia':'Data urodzenia',kidDate?fmt(kidDate):'',A.termin?'termin: '+fmt(A.termin):'')}${fld('Liczba dzieci',A.liczba||(c.typ==='adop'||c.typ==='zast'?'1':''))}`;
{const os=[];
if(parent(c)&&!c.spec)os.push(cb(c.zz,(c.n>1?'Dziecko ma zaświadczenie „Za życiem”'+(c.zz?kidList(c,k=>k.zazycie==='tak'):''):'Dziecko ma zaświadczenie „Za życiem”')));
if(c.typ==='mama'&&!c.spec&&c.A.w815!==undefined)os.push(cb(A.w815==='815',`Zamierzam skorzystać z pełnego wymiaru urlopu macierzyńskiego i rodzicielskiego (zasiłek ${pc(CFG.st815)}%)`+(A.w815==='niewiem'?`: do decyzji${c.birth?', najpóźniej do '+fmt(addD(c.birth,CFG.okno815)):''}`:'')));
if(f==='uop'&&!c.spec)os.push(cb(A.laczenie&&A.laczenie!=='nie','Łączę urlop rodzicielski z pracą u pracodawcy'+(A.laczenie&&A.laczenie!=='nie'?` (${A.laczenie==='0.5'?'1/2':'1/4'} etatu)`:'')));
if(parent(c)&&A.etap==='po'&&!c.spec)os.push(cb(c.hospAny,'Dotyczy dziecka wymagającego hospitalizacji / wcześniaka'+(c.hospAny?kidList(c,k=>k.hosp==='wczesniak'||k.hosp==='hosp'):'')));
if(os.length)h+=`<div class="sec">Oświadczenia</div>${os.join('')}`;}
if(c.typ==='mama'||c.typ==='adop'||c.typ==='zast')h+=`<div class="sec">Drugi rodzic</div>${fld('Korzysta z urlopu',A.drugi?{rodz:'tak, część rodzicielskiego'+(A.drugi_tyg?` (${A.drugi_tyg} tyg.)`:''),przej:'tak, przejmie część macierzyńskiego',nie:'nie',niewiem:'jeszcze nie wiadomo'}[A.drugi]:(c.k?'':'nie dotyczy'))}`;
if(!uop)h+=`<div class="sec">Wypłata</div>${fld('Rachunek bankowy',A.konto_ok===true?d.konto:A.konto||'')}`;
h+=`<div class="stamp">Wypełnione automatycznie z danych ZUS i odpowiedzi w rozmowie. ${R.w?esc(R.w.when):''}</div>`;
{const s=seq(),dn=!s.length||!s[s.length-1].cur;const sent=S.sent.find(x=>x.name===R.w?.name);
h+=`<div class="acts">${R.w&&dn?(sent?`<span class="okmsg">Wysłano ${fmt(sent.d)}, numer ${esc(sent.ref)} </span>`:`<button class="btn y" id="wsend">Wyślij ${f==='uop'?'do pracodawcy':'do ZUS'} </button>`):'<span class="note">Wysyłka będzie możliwa po zakończeniu rozmowy.</span>'}${R.w&&dn?dlButtons():''}${(parent(c)||c.typ==='adop')&&A.etap==='po'&&!A.spec?(S.akty.length?`<span class="okmsg">Wniosek o odpis złożony ${fmt(S.akty[S.akty.length-1].d)}</span> <button class="btn sm" data-goto="akt">Szczegóły</button>`:'<button class="btn" data-goto="akt">Zamów odpis aktu urodzenia (gov.pl)</button>'):''}</div>`}
h+='</div>';
return h;
}
function panelWynik(R){
const c=ctx();
if(!c.typ)return '<div class="empty">Wynik pojawi się po pierwszych odpowiedziach w rozmowie.</div>';
let h='';
const s=seq(),done=!s.length||!s[s.length-1].cur;
if(!done)h+=`<p class="note">Rozmowa w toku: wynik uzupełnia się na bieżąco.</p>`;
if(R.blocked)h+=`<div class="hero bad"><h3>Zasiłek nie przysługuje</h3><p style="margin:0">${esc(R.blocked)}</p></div>`;
else if(R.w)h+=`<div class="hero okb"><h3>${esc(R.w.name)}</h3><div class="where">${esc(R.w.where)}</div><div class="kv"><span>${esc(R.w.pay)}</span><span>${esc(R.w.when)}</span></div></div>`;
if(R.ben.length){h+=`<h3 class="h">Co Ci przysługuje</h3><table class="stack"><thead><tr><th>Świadczenie</th><th>Okres</th><th>Stawka</th><th style="text-align:right">Ok. miesięcznie</th></tr></thead><tbody>${R.ben.map(b=>`<tr><td data-l="Świadczenie"><div>${esc(b.n)} <span class="rid">${b.r}</span></div></td><td data-l="Okres"><div>${b.od?`<span class="nw">${fmt(b.od)}</span> – <span class="nw">${b.do?fmt(b.do):'…'}</span><br>`:''}${esc(b.tyg||b.okr||'')}${b.note?'<br><span class="note">'+esc(b.note)+'</span>':''}</div></td><td data-l="Stawka" class="n">${String(b.pct).replace('.',',')}%</td><td data-l="Ok. miesięcznie" class="n">${b.m!==null&&b.m!==undefined?zl(b.m):'—'}</td></tr>`).join('')}</tbody></table><p class="note">Kwoty orientacyjne: podstawa = wynagrodzenie brutto pomniejszone o ${pc(CFG.skladki)}% składek; zasiłek macierzyński nie niższy niż ${CFG.minZas} zł.</p>`}
if(R.cmp){const x=R.cmp,row=(lab,v,pm,pr,key)=>`<tr><td data-l="Wariant"><strong>${lab}</strong></td><td data-l="Macierzyński (${x.macW} tyg.)" class="n">${zl(v.mac)}<br><span class="note">${pm}%</span></td><td data-l="Rodzicielski (${x.rodzW} tyg.)" class="n">${zl(v.rodz)}<br><span class="note">${pr}%</span></td><td data-l="Razem za cały okres" class="n"><strong>${zl(v.tot)}</strong></td><td data-l=""><button class="btn sm" data-w815="${key}">Wybieram</button></td></tr>`;
 h+=`<h3 class="h">Porównanie wariantów wypłaty</h3><p class="note">Kwoty miesięczne zasiłku${x.termin?`. Wariant ${pc(CFG.st815)}% wymaga wniosku do ${fmt(x.termin)} (${CFG.okno815} dni po porodzie)`:''}.</p><table class="stack"><thead><tr><th>Wariant</th><th style="text-align:right">Macierzyński (${x.macW} tyg.)</th><th style="text-align:right">Rodzicielski (${x.rodzW} tyg.)</th><th style="text-align:right">Razem za cały okres</th><th></th></tr></thead><tbody>${row(`${CFG.stMac}% + ${CFG.stRodz}%`,x.a,CFG.stMac,CFG.stRodz,'100_70')}${row(`Równo ${pc(CFG.st815)}%`,x.b,pc(CFG.st815),pc(CFG.st815),'815')}</tbody></table><p class="note">${Math.abs(x.a.tot-x.b.tot)<200?'Łącznie wychodzi praktycznie tyle samo; różni się rozłożenie w czasie: pierwszy wariant daje więcej na macierzyńskim, drugi więcej na rodzicielskim.':x.a.tot>x.b.tot?'Przy Twoim podziale urlopu więcej łącznie daje wariant '+CFG.stMac+'% + '+CFG.stRodz+'%.':'Przy Twoim podziale urlopu więcej łącznie daje wariant '+pc(CFG.st815)+'%.'} Wybór możesz też zmienić, klikając odpowiedź w rozmowie.</p>`}
if(R.info.length)h+=`<ul class="list">${R.info.map(t=>`<li>${t.includes('<span')?t:esc(t)}</li>`).join('')}</ul>`;
if(R.risks.length)h+=`<h3 class="h">Ryzyka</h3><ul class="list">${R.risks.map(r=>`<li class="risk${r.h?' high':''}">${r.t.includes('<span')?r.t:esc(r.t)} <span class="rid">${r.id}</span></li>`).join('')}</ul>`;
if(R.good.length)h+=`<h3 class="h">Dobre wiadomości</h3><ul class="list">${R.good.map(r=>`<li class="good">${esc(r.t)} <span class="rid">${r.id}</span></li>`).join('')}</ul>`;
h+=zadlHTML(R);
if(R.att.length)h+=`<h3 class="h">Dokumenty do przygotowania</h3><ul class="list">${R.att.map(a=>`<li>${esc(a.t)} <span class="rid">${a.r}</span></li>`).join('')}</ul>`;
{const ks=kats(R);if(ks.size)h+=`<h3 class="h">Wsparcie</h3>${supportHTML(ks)}`}
h+=`<h3 class="h">Więcej o Twoich uprawnieniach</h3>${linksHTML(R)}<p class="note">Wszystkie strony: zakładka „Pomoc”. Masz pytanie o wynik? <button class="btn sm" data-goto="asystent">Zapytaj asystenta AI</button></p>`;
if(R.tl.length)h+=`<h3 class="h">Twoja oś czasu: kolejne wnioski i terminy</h3><ul class="tl">${R.tl.map(e=>`<li class="${diff(e.d,TODAY)>0?'past':''}${e.w?' w':''}"><span class="d">${fmt(e.d)}</span>${esc(e.t)}${e.x?`<div class="x">${esc(e.x)}</div>`:''}</li>`).join('')}</ul>`;
return h;
}
const USE={zus_fix:'aktualizacja danych z ZUS',forma_m:'wybór formularza (wniosek / ZAM)',platnik_m:'adresat wniosku',ponad20_m:'kto wypłaca zasiłek',od_m:'prawo do zasiłku (karencja)',koniec_m:'ciągłość ubezpieczenia do porodu',koniec_d:'ciągłość ubezpieczenia do porodu',dobr_m:'prawo do zasiłku',brutto_m:'kalkulator zasiłku',rola:'wszystkie wnioski',termin:'start macierzyńskiego, przypomnienia, wniosek 81,5%',data_porodu:'ZAM, rodzicielski, ojcowski (12 mies.), ZCNA',liczba:'wymiar urlopów',imie:'ZAM, ZCNA',hosp:'urlop uzupełniający',zazycie:'wydłużony rodzicielski',drugi:'podział rodzicielskiego, ZAM (okresy drugiego rodzica)',drugi_tyg:'kolejne części rodzicielskiego',tata_tyg:'wniosek o rodzicielski',w815:'wniosek 81,5%',laczenie:'wniosek o łączenie z pracą',przyjecie:'urlop na warunkach macierzyńskiego, rodzicielski',wiek:'limity wieku',sad:'ojcowski (12 mies. od uprawomocnienia)',konto:'każdy wniosek o wypłatę',konto_ok:'każdy wniosek o wypłatę',start_przed:'wniosek o urlop przed porodem',mama_status:'przejęcie urlopu przez tatę',zmiana:'strażnik ryzyk'};
function panelProfil(){
const c=ctx(),z=c.z,d=c.p.dane;
const zr=c.p.manual?[]:[['Imię i nazwisko',d.imie+' '+d.nazwisko],['PESEL',d.pesel],['Adres',d.adres],['Tytuł ubezpieczenia',FORMA[z.forma]],['Płatnik',z.platnik],['Płatnik > 20 ubezpieczonych',z.ponad20?'tak':'nie'],['Ubezpieczenie od',fmt(z.od)],['Umowa do',z.koniec?fmt(z.koniec):'bezterminowo'],['Dobrowolne chorobowe',z.forma==='uop'?'nie dotyczy':(z.dobr?'tak':'nie')],['Podstawa / wynagrodzenie brutto',z.brutto?new Intl.NumberFormat('pl-PL').format(z.brutto)+' zł':'—'],['Zadłużenie w składkach (dziś)',(()=>{const s=debtOn(c,TODAY);return s&&s.razem?zlTxt(s.razem):'brak'})()],['Rachunek',d.konto]];
const ans=seq().filter(x=>!x.cur);
return `<h3 class="h" style="margin-top:0">Z ZUS (symulacja)</h3>${zr.length?`<table class="stack"><tbody>${zr.map(r=>`<tr><td data-l="Pole">${esc(r[0])}</td><td data-l="Wartość">${esc(r[1])}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Brak danych z ZUS dla tego konta.</div>'}
<h3 class="h">Z rozmowy</h3>${ans.length?`<table class="stack"><thead><tr><th>Pytanie</th><th>Odpowiedź</th><th>Przyda się do</th><th></th></tr></thead><tbody>${ans.map(x=>`<tr><td data-l="Pytanie">${esc(x.q.id)}</td><td data-l="Odpowiedź">${esc(label(x.q,x.a))}</td><td data-l="Przyda się do">${esc(USE[x.q.base||x.q.id]||'—')}</td><td data-l=""><button class="btn sm" data-ed2="${x.q.id}">Zmień</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty">Jeszcze nic.</div>'}
<h3 class="h">Profil jako JSON</h3><p class="note">Ten obiekt zasila silnik reguł i formularze.</p><button class="btn sm" id="cp">Kopiuj JSON</button> <span class="note" id="cpm"></span>
<pre style="background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:12px;font-size:13px;overflow-x:auto">${esc(JSON.stringify({zus:c.p.manual?null:{...z,...d},odpowiedzi:S.A},null,2))}</pre>`;
}
function panelReguly(R){
const ids=[...R.fired].sort();
return `<h3 class="h" style="margin-top:0">Reguły użyte w tym przypadku (${ids.length})</h3>${ids.length?`<ul class="list">${ids.map(i=>`<li><strong>${i}</strong> ${esc(RULES[i]||'')}</li>`).join('')}</ul>`:'<div class="empty">Żadna reguła jeszcze nie zadziałała.</div>'}
<p class="note">Identyfikatory odpowiadają zakładce „Powiązania” w arkuszu.</p>
<h3 class="h">Parametry (panel administratora, demo)</h3><p class="note">Zmiana wartości od razu przelicza wynik. Domyślne wartości trzeba potwierdzić z załącznikiem ZUS.</p>
<div class="prm">${Object.keys(CFGL).map(k=>`<label for="p_${k}">${esc(CFGL[k])}<input type="number" step="any" id="p_${k}" data-k="${k}" value="${CFG[k]}"></label>`).join('')}${CFG.mac.map((v,i)=>`<label for="p_mac${i}">Macierzyński, ${i+1}${i===4?'+':''} dz. (tyg.)<input type="number" id="p_mac${i}" data-mi="${i}" value="${v}"></label>`).join('')}</div>`;
}
function renderPanel(R){
const tabs=[['wniosek','Wniosek'],['wynik','Wynik'],['profil','Profil'],['reguly','Reguły']];
$('#tabs').innerHTML=tabs.map(t=>`<button class="tab${S.tab===t[0]?' on':''}" data-t="${t[0]}">${t[1]}</button>`).join('');
document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;renderPanel(compute())});
const body=$('#pbody');
body.innerHTML=S.tab==='wniosek'?panelWniosek(R):S.tab==='wynik'?panelWynik(R):S.tab==='profil'?panelProfil():panelReguly(R);
document.querySelectorAll('[data-ed2]').forEach(b=>b.onclick=()=>{forget(b.dataset.ed2);S.m='chat';renderWork(true)});
document.querySelectorAll('[data-k]').forEach(i=>i.onchange=()=>{const v=parseFloat(i.value);if(!isNaN(v))CFG[i.dataset.k]=v;renderWork()});
document.querySelectorAll('[data-mi]').forEach(i=>i.onchange=()=>{const v=parseFloat(i.value);if(!isNaN(v))CFG.mac[+i.dataset.mi]=v;renderWork()});
if($('#wsend'))$('#wsend').onclick=()=>{S.sent.push({name:R.w.name,where:R.w.where,d:TODAY,ref:'SYM-'+String(Math.floor(1000+Math.random()*9000))});renderPanel(compute())};
bindZadl(R);
document.querySelectorAll('[data-w815]').forEach(b=>b.onclick=()=>{S.A.w815=b.dataset.w815;S.order=S.order.filter(x=>x!=='w815');S.order.push('w815');delete S.raw.w815;renderWork(true)});
bindDl();
bindGoto();
if($('#cp'))$('#cp').onclick=()=>{try{navigator.clipboard.writeText(JSON.stringify({odpowiedzi:S.A},null,2)).then(()=>$('#cpm').textContent='Skopiowano.',()=>$('#cpm').textContent='Przeglądarka nie pozwoliła skopiować; zaznacz tekst poniżej.')}catch(e){$('#cpm').textContent='Zaznacz tekst poniżej.'}};
}
