/* Podgląd e-ZLA i symulacja połączenia z PUE/eZUS */
/* ---------- e-ZLA (symulacja podglądu) ---------- */
const EZLA_KOD={'':'brak kodu',A:'A: kolejna niezdolność z powodu tej samej choroby po przerwie do 60 dni',B:'B: niezdolność do pracy w okresie ciąży',C:'C: niezdolność spowodowana nadużyciem alkoholu',D:'D: gruźlica',E:'E: choroba zakaźna'};
const EZLA_WSK={1:'1: chory powinien leżeć',2:'2: chory może chodzić'};
const ezDni=e=>diff(e.od,e.do)+1;
function ezlaHTML(c){
 const L=(c.ezla||[]).slice().sort((a,b)=>diff(a.od,b.od));
 if(c.man)return '<div class="empty">Brak danych z ZUS dla tego konta.</div>';
 if(!L.length)return '<div class="empty">Na koncie nie ma zaświadczeń lekarskich e-ZLA.</div>';
 const rok=String(new Date().getFullYear()),act=L.filter(e=>e.status!=='anulowane');
 const wRoku=act.filter(e=>e.od.slice(0,4)===rok).reduce((a,e)=>a+ezDni(e),0);
 const ciaz=act.filter(e=>e.kod==='B').reduce((a,e)=>a+ezDni(e),0);
 let h=`<ul class="facts kv2"><li><span>Zaświadczeń (ważnych)</span><strong>${act.length}</strong></li><li><span>Dni niezdolności w ${rok} r.</span><strong>${wRoku}</strong></li><li><span>Dni w ciąży (kod B)</span><strong>${ciaz}</strong></li>${c.ezlaNow?`<li><span>Trwa teraz</span><strong>do ${fmt(c.ezlaNow.do)}</strong></li>`:''}</ul>`;
 if(c.forma==='uop')h+=`<p class="note">Przy umowie o pracę za pierwsze 33 dni niezdolności w roku płaci pracodawca (wynagrodzenie chorobowe), za dalsze ZUS (zasiłek chorobowy). W ${rok} r.: ${Math.min(33,wRoku)} dni po stronie pracodawcy${wRoku>33?`, ${wRoku-33} dni zasiłku`:''}.</p>`;
 h+=`<table class="stack"><thead><tr><th>Seria i numer</th><th>Okres</th><th>Kod</th><th>Wskazanie</th><th>Status</th></tr></thead><tbody>${L.map(e=>`<tr><td data-l="Seria i numer"><details><summary>${esc(e.nr||'—')}</summary><div class="note">Wystawione ${fmt(e.wyst||e.od)}<br>${esc(e.lekarz||'')}<br>${esc(e.plac||'')}<br>Płatnik: ${esc(c.platnik)}</div></details></td><td data-l="Okres"><span class="nw">${fmt(e.od)}</span> – <span class="nw">${fmt(e.do)}</span><br><span class="note">${ezDni(e)} dni</span></td><td data-l="Kod">${esc(EZLA_KOD[e.kod]||e.kod)}</td><td data-l="Wskazanie">${esc(EZLA_WSK[e.wsk]||'—')}</td><td data-l="Status">${e.status==='anulowane'?'<span class="note">anulowane przez lekarza</span>':diff(e.do,TODAY)<=0&&diff(e.od,TODAY)>=0?'<strong>trwa</strong>':'wystawione'}</td></tr>`).join('')}</tbody></table>`;
 h+=`<p class="note">Kod literowy wpisuje lekarz. Rozpoznanie choroby (kod ICD-10) nie jest widoczne w tym podglądzie.</p>`;
 return h}

/* ---------- PUE / eZUS (symulacja połączenia) ---------- */
const EZ_TABS=[['konto','Dane na koncie'],['skladki','Składki'],['ezla','Zwolnienia e-ZLA'],['swiad','Wnioski i świadczenia'],['wiad','Wiadomości do ZUS']];
function skladkiRows(c){
 const z=c.z;if(c.man||!z||z.forma==='brak'||!z.od)return [];
 const out=[],L=zadlLedger(c)||[];
 for(let k=1;k<=6;k++){const d=new Date(TODAY+'T12:00:00');d.setDate(1);d.setMonth(d.getMonth()-k);const m=iso(d);if(diff(z.od.slice(0,7)+'-01',m)<0)break;
  const nieop=L.find(x=>x.okres.slice(0,7)===m.slice(0,7));
  const podst=z.brutto;
  out.push({m,podst,chor:z.forma==='uop'||z.dobr?Math.round(podst*2.45)/100:0,st:nieop?'nieopłacone':z.forma==='jdg'?'opłacone':'rozliczone przez płatnika'})}
 return out}
function ezusBody(R){
 const c=ctx(),z=c.z,d=c.p.dane,t=S.ezTab;
 if(c.p.manual)return '<div class="empty">To konto nie ma danych w ZUS (profil bez danych). W prawdziwym eZUS zobaczysz tu swoje okresy ubezpieczenia i składki.</div>';
 if(t==='konto'){const ub=z.forma==='brak'?[['Ubezpieczenia','brak aktualnego tytułu do ubezpieczeń']]:[['Tytuł ubezpieczenia',FORMA[z.forma]],['Płatnik składek',z.platnik],['Okres',`od ${fmt(z.od)}${z.koniec?' do '+fmt(z.koniec):''}`],['Emerytalne i rentowe','tak'],['Chorobowe',z.forma==='uop'?'obowiązkowe':z.dobr?'dobrowolne':'brak'],['Wypadkowe','tak'],['Płatnik > 20 ubezpieczonych',z.ponad20?'tak':'nie']];
  return `<h3 class="h" style="margin-top:0">Dane ubezpieczonego</h3><table class="stack"><tbody>${[['Imię i nazwisko',d.imie+' '+d.nazwisko],['PESEL',d.pesel],['Adres',d.adres],['Rachunek do wypłat',d.konto]].map(r=>`<tr><td data-l="Pole">${esc(r[0])}</td><td data-l="Wartość">${esc(r[1])}</td></tr>`).join('')}</tbody></table>
<h3 class="h">Zgłoszenia do ubezpieczeń</h3><table class="stack"><tbody>${ub.map(r=>`<tr><td data-l="Pole">${esc(r[0])}</td><td data-l="Wartość">${esc(r[1])}</td></tr>`).join('')}</tbody></table>
<p class="note">Jeśli dane się nie zgadzają, napisz do ZUS w zakładce „Wiadomości do ZUS” albo popraw je na początku formularza.</p>`}
 if(t==='skladki'){const rows=skladkiRows(c),now=debtOn(c,TODAY);
  return `<h3 class="h" style="margin-top:0">Składki z ostatnich miesięcy</h3>${rows.length?`<table class="stack"><thead><tr><th>Miesiąc</th><th style="text-align:right">Podstawa</th><th style="text-align:right">W tym chorobowe</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td data-l="Miesiąc">${mies(r.m)}</td><td data-l="Podstawa" class="n">${zlTxt(r.podst)}</td><td data-l="Chorobowe" class="n">${r.chor?zlTxt(r.chor):'—'}</td><td data-l="Status">${r.st==='nieopłacone'?'<strong style="color:var(--red)">nieopłacone</strong>':r.st}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Brak składek do pokazania.</div>'}
${z.forma==='jdg'?`<p>Saldo na dziś: <strong>${now&&now.razem?zlTxt(now.razem)+' zadłużenia':'brak zadłużenia'}</strong>. <button class="btn sm" data-goto="dokumenty">Zaświadczenie o zadłużeniu</button></p>`:'<p class="note">Składki za Ciebie rozlicza płatnik. Podstawa to wynagrodzenie brutto z danych ZUS (symulacja).</p>'}`}
 if(t==='ezla')return `<h3 class="h" style="margin-top:0">Zaświadczenia lekarskie e-ZLA</h3>${ezlaHTML(c)}`;
 if(t==='swiad')return `<h3 class="h" style="margin-top:0">Wnioski złożone przez aplikację</h3>${S.sent.length?`<ul class="list">${S.sent.map(x=>`<li><strong>${esc(x.name)}</strong> (${esc(x.ref)}), ${fmt(x.d)}<br><span class="note">${esc(x.where)}: przyjęty do rozpatrzenia</span></li>`).join('')}</ul>`:'<div class="empty">Brak złożonych wniosków.</div>'}${R.w?`<p class="note">Do złożenia: ${esc(R.w.name)}. <button class="btn sm" data-goto="form">Otwórz wniosek</button></p>`:''}`;
 const TEM=['Zasiłek macierzyński i urlopy','Zasiłek chorobowy i e-ZLA','Składki i zadłużenie','Dane na moim koncie','Inna sprawa'];
 return `<h3 class="h" style="margin-top:0">Zapytaj ZUS</h3><p class="note">Masz wątpliwość? Wyślij wiadomość z konta eZUS. W prototypie odpowiedź przychodzi od razu i jest przygotowana automatycznie z danych Twojej sprawy.</p>
<form id="ezf" class="ezf"><label for="ezt">Temat</label><select id="ezt">${TEM.map(x=>`<option>${esc(x)}</option>`).join('')}</select><label for="ezq">Treść</label><textarea id="ezq" rows="4" placeholder="Np. czy moje zwolnienie z kodem B jest już widoczne w ZUS?"></textarea><div class="acts"><button class="btn pri" type="submit">Wyślij do ZUS (symulacja)</button><span class="err" id="ezer"></span></div></form>
${S.ezMsg.length?`<h3 class="h">Twoje wiadomości</h3><ul class="list">${S.ezMsg.slice().reverse().map(m=>`<li><strong>${esc(m.temat)}</strong> <span class="note">${esc(m.nr)}, ${fmt(m.d)}</span><p style="margin:6px 0">${esc(m.tresc)}</p><div class="b bot" style="max-width:none">${esc(m.odp)}</div></li>`).join('')}</ul>`:''}`}
function ezReply(temat){
 const c=ctx(),R=compute(),z=c.z;
 const pre='Dzień dobry, dziękujemy za wiadomość. ',post=' W razie dalszych pytań prosimy o kontakt przez eZUS lub z Centrum Obsługi Telefonicznej. (Odpowiedź symulowana na podstawie danych z aplikacji.)';
 if(temat.startsWith('Zasiłek macierzyński'))return pre+(R.w?`Na podstawie danych na koncie właściwy wniosek to: ${R.w.name}. ${R.w.where}. ${R.w.pay}`:R.blocked?R.blocked:'Prosimy o uzupełnienie formularza, abyśmy mogli wskazać właściwy wniosek.')+post;
 if(temat.startsWith('Zasiłek chorobowy')){const L=(c.ezla||[]).filter(e=>e.status!=='anulowane');return pre+(L.length?`Na koncie widzimy ${L.length} ważne zaświadczenie(-a) e-ZLA, ostatnie za okres ${fmt(L[L.length-1].od)} – ${fmt(L[L.length-1].do)}${L[L.length-1].kod==='B'?' z kodem B (ciąża), co oznacza zasiłek w wysokości 100% podstawy':''}.`:'Na koncie nie widzimy zaświadczeń e-ZLA.')+(z.forma==='jdg'?' Przy działalności o zasiłek chorobowy wnioskuje się na druku ZAS-53.':'')+post}
 if(temat.startsWith('Składki')){const s=debtOn(c,TODAY);return pre+(z.forma==='jdg'?(s&&s.razem?`Na dzień ${fmt(TODAY)} stan zadłużenia wynosi ${zlTxt(s.razem)}. Zaświadczenie o stanie zadłużenia można wygenerować w zakładce „Dokumenty”.`:'Na koncie nie ma zaległości w składkach.'):'Składki za Panią/Pana rozlicza płatnik; na koncie nie ma zaległości po Pani/Pana stronie.')+post}
 if(temat.startsWith('Dane'))return pre+`Na koncie zapisano: ${FORMA[z.forma]||'brak tytułu ubezpieczenia'}${z.forma!=='brak'?', płatnik '+z.platnik+', od '+fmt(z.od):''}. Jeśli dane są nieaktualne, płatnik składek powinien złożyć korektę zgłoszenia.`+post;
 return pre+'Wiadomość została przekazana do właściwej komórki. Odpowiedź otrzymasz na konto eZUS.'+post}
function renderEzus(){
 if(!S.ezOn){$('#app').innerHTML='<div class="wrap"><h2 class="hi">eZUS</h2><div class="empty">Łączenie z PUE/eZUS (symulacja)…</div></div>';setTimeout(()=>{S.ezOn=true;if(S.view==='ezus')renderEzus()},500);return}
 const R=compute(),c=ctx();
 $('#app').innerHTML=page('eZUS',`<p class="note">Symulacja połączenia z Platformą Usług Elektronicznych ZUS (eZUS). Zalogowano jako <strong>${esc(c.p.manual?'gość':nm(c.p))}</strong> przez mObywatel. Dane są zmyślone. Prawdziwy serwis: <a href="https://www.zus.pl/ezus/logowanie?jezyk=pl" target="_blank" rel="noopener">zus.pl/ezus</a>.</p>
<div class="tabs" role="tablist">${EZ_TABS.map(x=>`<button class="tab${S.ezTab===x[0]?' on':''}" data-ezt="${x[0]}">${x[1]}</button>`).join('')}</div><div class="ezbody">${ezusBody(R)}</div>`);
 document.querySelectorAll('[data-ezt]').forEach(b=>b.onclick=()=>{S.ezTab=b.dataset.ezt;renderEzus()});
 if($('#ezf'))$('#ezf').onsubmit=e=>{e.preventDefault();const q=$('#ezq').value.trim();if(!q){$('#ezer').textContent='Wpisz treść wiadomości.';return}const temat=$('#ezt').value;
  S.ezMsg.push({nr:'ZUS-WIAD/'+String(Math.floor(100000+Math.random()*900000)),d:TODAY,temat,tresc:q,odp:ezReply(temat)});renderEzus()};
 bindGoto();
}
