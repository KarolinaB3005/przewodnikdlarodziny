/* Wniosek o odpis aktu urodzenia (Pokaz usługi Rejestru Stanu Cywilnego) */
/* Zasady według gov.pl (zglos-urodzenie-dziecka, uzyskaj-odpis-aktu-stanu-cywilnego):
   akt urodzenia powstaje dopiero po zgłoszeniu urodzenia (21 dni od wystawienia karty urodzenia);
   po rejestracji rodzic dostaje bezpłatnie jeden odpis skrócony; kolejne: 22 zł (skrócony), 33 zł (zupełny),
   bez opłaty m.in. w sprawach ZUS i zatrudnienia; odbiór: e-Doręczenia, dowolny USC, poczta; do 7 dni. */
const AKT_RODZ={skrocony:['Odpis skrócony','Podstawowe dane z aktu: imię i nazwisko dziecka, data i miejsce urodzenia, dane rodziców. Wystarcza zwykle do wniosków o zasiłek i urlop.'],zupelny:['Odpis zupełny','Pełna treść aktu wraz z późniejszymi wzmiankami i przypiskami (np. o uznaniu ojcostwa, zmianie imienia).']};
const AKT_OPLATA={skrocony:22,zupelny:33};
const AKT_SPOSOB={elektr:'Elektronicznie, na skrzynkę do e-Doręczeń',usc:'Odbiór osobiście w dowolnym urzędzie stanu cywilnego',poczta:'Pocztą tradycyjną na adres zamieszkania'};
/* symulacja postępu: przyjęty -> w realizacji -> wynik zależny od sposobu odbioru */
const aktyNext=()=>{for(const a of S.akty)a.status=a.status==='przyjęty do realizacji'?'w realizacji':a.sposob==='elektr'?'doręczony na skrzynkę e-Doręczeń':a.sposob==='usc'?'gotowy do odbioru w USC':'wysłany pocztą'};
const aktyHTML=()=>`<ul class="list">${S.akty.map(a=>`<li><strong>${esc(a.nr)}</strong>: ${esc(AKT_RODZ[a.rodzaj][0])}, ${a.egz} egz. × ${a.dzieci.length} ${a.dzieci.length>1?'dzieci':'dziecko'} (${esc(a.dzieci.join(', '))})<br><span class="note">Złożony ${fmt(a.d)} · ${esc(AKT_SPOSOB[a.sposob])} · status: <strong>${esc(a.status)}</strong></span></li>`).join('')}</ul>`;
/* dzieci, których akt urodzenia jest w Rejestrze Stanu Cywilnego (dane profilu, bez potrzeby wypełniania formularza) */
const rscKids=p=>(p&&p.rsc&&p.rsc.dzieci)||[];
const rscName=k=>k.imie+' '+k.nazwisko;
/* profil bez danych RSC: dziecko zgłoszone w rozmowie (etap „po”, data porodu) też można wybrać do odpisu */
const talkKids=c=>parent(c)&&c.A.etap==='po'&&c.birth&&!c.spec?c.kids.map(k=>({imie:k.imie||(c.n>1?'Dziecko '+k.i:'Dziecko'),nazwisko:c.p.dane.nazwisko||'',ur:c.birth,miejsce:((c.p.dane.adres||'').split(' ').pop()||''),usc:'USC właściwy dla miejsca urodzenia',zarej:null,rozmowa:true})):[];
const ZGLOS_URL='https://www.gov.pl/web/gov/zglos-urodzenie-dziecka';
function renderAkt(){
 const c=ctx(),kids=rscKids(c.p).length?rscKids(c.p):talkKids(c),rel=c.p.rsc?c.p.rsc.rel:({mama:'matka',tata:'ojciec'})[c.typ];
 let h=`<p class="note">Rekonstrukcja e-usługi „Uzyskaj odpis aktu stanu cywilnego” z Rejestru Stanu Cywilnego. Prawdziwa usługa: <a href="https://www.gov.pl/web/gov/uzyskaj-odpis-aktu-stanu-cywilnego-urodzenia-malzenstwa-zgonu" target="_blank" rel="noopener">gov.pl: uzyskaj odpis aktu stanu cywilnego</a> (logowanie profilem zaufanym lub e-dowodem). O odpis może wystąpić m.in. rodzic dziecka.</p>`;
 if(!kids.length){
  h+=c.typ==='zast'
   ?`<div class="empty">Rodzina zastępcza nie potrzebuje odpisu aktu urodzenia do wniosku w tej aplikacji. Dokumenty dziecka zwykle przekazuje sąd lub organizator pieczy zastępczej.</div>`
   :`<div class="empty"><strong>W Rejestrze Stanu Cywilnego nie ma jeszcze aktu urodzenia Twojego dziecka.</strong> Odpis będzie dostępny po urodzeniu i zarejestrowaniu dziecka: akt urodzenia powstaje dopiero po zgłoszeniu urodzenia.</div>
<h3 class="h">Jak to działa po porodzie</h3><ul class="list">
<li>Lekarz lub położna wystawia kartę urodzenia i w ciągu 3 dni przekazuje ją do urzędu stanu cywilnego.</li>
<li>Urodzenie zgłaszasz w ciągu <strong>21 dni od wystawienia karty urodzenia</strong>: online na gov.pl albo w USC właściwym dla miejsca urodzenia dziecka. Usługa jest bezpłatna.</li>
<li>Po rejestracji dostajesz <strong>bezpłatnie jeden odpis skrócony</strong> aktu urodzenia, powiadomienie o numerze PESEL i potwierdzenie zameldowania dziecka. Ten odpis wystarczy do wniosku o zasiłek lub urlop.</li>
<li>Jeśli nie zgłosisz urodzenia w terminie, kierownik USC zarejestruje je sam na podstawie karty urodzenia i sam wybierze dziecku imię.</li>
<li>Kolejne odpisy zamówisz tutaj, gdy akt będzie już w rejestrze.</li></ul>
<p class="note">Źródło: <a href="${ZGLOS_URL}" target="_blank" rel="noopener">gov.pl: zgłoś urodzenie dziecka</a>.</p>`;
 }else{
  h+=`<form id="akf" class="ezf"><div class="cols"><div>
<fieldset><legend>Wnioskodawca</legend><p style="margin:4px 0">${esc(nm(c.p))}${rel?', '+esc(rel)+' '+(kids.length>1?'dzieci':'dziecka'):''}</p></fieldset>
<fieldset><legend>Akt urodzenia (${kids[0].rozmowa?'dziecko z rozmowy':'z Rejestru Stanu Cywilnego'})</legend>${kids.map((k,i)=>`<label class="chk"><input type="checkbox" data-akk="${i}" checked> <span><strong>${esc(rscName(k).trim())}</strong>, ur. ${fmt(k.ur)}${k.miejsce?', '+esc(k.miejsce):''}<br><span class="note">${k.rozmowa?'dane z rozmowy; akt powstaje po zgłoszeniu urodzenia w USC (do 21 dni od wystawienia karty urodzenia)':`akt sporządzony ${fmt(k.zarej)}, ${esc(k.usc)}`}</span></span></label>`).join('')}
${kids.some(k=>k.adop)?`<label class="chk" style="margin-top:10px"><input type="checkbox" id="akprawo"> Postanowienie sądu o przysposobieniu jest już prawomocne</label><p class="note" style="margin:4px 0 0 26px">Dopiero wtedy w akcie urodzenia są dane rodziców adopcyjnych i możesz zamówić odpis jako rodzic. Szczegóły potwierdzisz w USC.</p>`:''}</fieldset>
<fieldset><legend>Rodzaj odpisu</legend>${Object.entries(AKT_RODZ).map(([k,v],i)=>`<label class="chk"><input type="radio" name="akr" value="${k}"${i===0?' checked':''}> <strong>${v[0]}</strong> <span class="note">(${AKT_OPLATA[k]} zł)</span></label><p class="note" style="margin:0 0 8px 26px">${esc(v[1])}</p>`).join('')}</fieldset>
</div><div>
<fieldset><legend>Liczba egzemplarzy (na każde dziecko)</legend><input type="number" id="ake" min="1" max="5" value="1" aria-label="Liczba egzemplarzy"></fieldset>
<fieldset><legend>Sposób odbioru</legend>${Object.entries(AKT_SPOSOB).map(([k,v],i)=>`<label class="chk"><input type="radio" name="aks" value="${k}"${i===0?' checked':''}> ${esc(v)}</label>`).join('')}<p class="note" style="margin:6px 0 0">Odpis dostaniesz w ciągu 7 dni. Przy odbiorze na e-Doręczenia może zostać wygenerowany od razu.</p></fieldset>
<fieldset><legend>Cel i opłata</legend><p style="margin:4px 0">${esc(c.forma==='uop'?'Wniosek o urlop do pracodawcy':c.forma?'Wniosek o zasiłek do ZUS':'Sprawa w ZUS lub u pracodawcy')}</p><p class="note" style="margin:4px 0 0">Odpis do sprawy w ZUS lub związanej z zatrudnieniem jest zwolniony z opłaty skarbowej. W innych sprawach: ${AKT_OPLATA.skrocony} zł za skrócony, ${AKT_OPLATA.zupelny} zł za zupełny.</p></fieldset>
</div></div><div class="acts"><button class="btn y" type="submit">Złóż wniosek o odpis </button><span class="err" id="aker"></span></div></form>`}
 if(S.akty.length)h+=`<p class="note">Złożone wnioski (${S.akty.length}) i ich status znajdziesz w <button class="btn sm" data-goto="wnioski">Moje wnioski</button></p>`;
 $('#app').innerHTML=page('Odpis aktu urodzenia',h);
 if($('#akf'))$('#akf').onsubmit=e=>{e.preventDefault();
  const sel=[...document.querySelectorAll('[data-akk]:checked')].map(x=>kids[+x.dataset.akk]);if(!sel.length){$('#aker').textContent='Wybierz co najmniej jedno dziecko.';return}
  if(sel.some(k=>k.adop)&&!$('#akprawo').checked){$('#aker').textContent='Odpis z danymi rodziców adopcyjnych zamówisz po uprawomocnieniu postanowienia o przysposobieniu. Zaznacz pole, jeśli postanowienie jest już prawomocne.';return}
  const egz=Math.max(1,Math.min(5,+$('#ake').value||1));
  S.akty.push({nr:'RSC/'+new Date().getFullYear()+'/'+String(Math.floor(100000+Math.random()*900000)),d:TODAY,rodzaj:document.querySelector('[name=akr]:checked').value,sposob:document.querySelector('[name=aks]:checked').value,egz,dzieci:sel.map(k=>k.imie),status:'przyjęty do realizacji'});
  const a=S.akty[S.akty.length-1];
  popup(`<h3>Wniosek przyjęty do realizacji</h3><p>Numer wniosku: <strong>${esc(a.nr)}</strong></p><p class="note">${esc(AKT_RODZ[a.rodzaj][0])}, ${a.egz} egz. × ${a.dzieci.length} (${esc(a.dzieci.join(', '))}). ${esc(AKT_SPOSOB[a.sposob])}.</p>`,'Przejdź do Moich wniosków',()=>{S.view='wnioski';render()})};
 bindGoto();
}
