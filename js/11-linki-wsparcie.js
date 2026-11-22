/* Organizacje wsparcia, linki do uprawnień i wspólne elementy stron */
const SUPPORT=[
{n:'Fundacja Wcześniak Rodzice-Rodzicom',k:'wczesniak',t:'Pomoc rodzicom dzieci urodzonych przed 36. tygodniem ciąży: bezpłatna wypożyczalnia sprzętu, „Niezbędnik rodzica wcześniaka”, porady ekspertów.',u:'https://www.wczesniak.pl'},
{n:'Fundacja Koalicja dla wcześniaka',k:'wczesniak',t:'Działa w imieniu rodziców wcześniaków, współtworzy porozumienie organizacji pomagających wcześniakom.'},
{n:'Fundacja Gajusz (Łódź)',k:'choroba',t:'Hospicjum perinatalne, stacjonarne i domowe dla dzieci; wsparcie rodzin, gdy dziecko jest nieuleczalnie chore.',u:'https://gajusz.org.pl'},
{n:'Fundacja Warszawskie Hospicjum dla Dzieci',k:'choroba',t:'Hospicjum perinatalne i domowe; poradnia dla rodzin, wsparcie w żałobie.',u:'https://perinatalne.pl'},
{n:'Pomorze Dzieciom',k:'strata',t:'Hospicjum domowe dla dzieci, hospicjum perinatalne i centrum wsparcia po stracie dziecka.'},
{n:'Fundacja Rodzić po Ludzku',k:'strata',t:'Prawa rodziców w szpitalu, w tym po stracie dziecka i po poronieniu; informacje i interwencje.',u:'https://rodzicpoludzku.pl'},
{n:'Stowarzyszenie Rodziców po Poronieniu',k:'strata',t:'Wsparcie dla rodziców po poronieniu i stracie dziecka w czasie ciąży.'},
{n:'Ośrodki perinatalnej opieki paliatywnej (pacjent.gov.pl)',k:'choroba',t:'Lista ośrodków w Polsce, które opiekują się rodziną, gdy dziecko jest śmiertelnie chore.',u:'https://pacjent.gov.pl'}
];
const LINKS=[
['https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski','zus.pl: zasiłek macierzyński (komu przysługuje, wnioski)','mac'],
['https://www.zus.pl/ezla','zus.pl: zwolnienia lekarskie e-ZLA','ezla'],
['https://www.zus.pl/ezus/logowanie?jezyk=pl','eZUS (PUE ZUS): dane na koncie, wiadomości do ZUS','ezus'],
['https://www.gov.pl/web/rodzina/urlop-rodzicielski','gov.pl (Ministerstwo Rodziny, Pracy i Polityki Społecznej): urlop rodzicielski','rodz'],
['https://www.pip.gov.pl/porady-prawne/rodzicielstwo','pip.gov.pl (Państwowa Inspekcja Pracy): porady prawne, rodzicielstwo','pip'],
['https://www.gov.pl/web/gov/uzyskaj-odpis-aktu-stanu-cywilnego-urodzenia-malzenstwa-zgonu','gov.pl: odpis aktu urodzenia (Rejestr Stanu Cywilnego)','akt'],
['https://www.gov.pl/web/gov/zglos-urodzenie-dziecka','gov.pl: zgłoszenie urodzenia dziecka (21 dni)','zglos']
];
const kats=R=>{const c=ctx(),k=new Set();if(R&&R.support)k.add('strata');if(c.hospAny)k.add('wczesniak');if(c.zz)k.add('choroba');return k};
const supportHTML=ks=>{const L=SUPPORT.filter(s=>!ks||ks.has(s.k));return L.length?`<ul class="list">${L.map(s=>`<li><strong>${esc(s.n)}</strong><br>${esc(s.t)}${s.u?`<br><a href="${s.u}" target="_blank" rel="noopener">${esc(s.u.replace('https://',''))}</a>`:''}</li>`).join('')}</ul>`:''};
/* linki do uprawnień; z argumentem R wybiera i uzasadnia te, które dotyczą sytuacji użytkownika */
const LINK_WHY={mac:'masz prawo do zasiłku macierzyńskiego',ezla:'masz zwolnienia lekarskie e-ZLA',ezus:'sprawdzisz dane na koncie i zapytasz ZUS',rodz:'wymiar i podział urlopu rodzicielskiego',pip:'prawa pracownika-rodzica: ochrona przed zwolnieniem, urlopy',akt:'odpis aktu urodzenia do wniosków',zglos:'po porodzie trzeba zgłosić urodzenie w USC'};
function linkTags(R){const c=ctx(),A=c.A,t=new Set(['ezus']);if(!R||!c.typ)return null;
 if(R.ben.some(b=>/macierzy|rodzicielsk|ojcowsk/i.test(b.n)))t.add('mac');
 if(R.ben.some(b=>/rodzicielsk/i.test(b.n)))t.add('rodz');
 if(c.ezla.length||A.l4===true)t.add('ezla');
 if(c.forma==='uop')t.add('pip');
 if(parent(c)&&!c.spec&&!rscKids(c.p).length)t.add('zglos');
 if((((parent(c)||c.typ==='adop')&&A.etap==='po')||rscKids(c.p).length)&&!c.spec)t.add('akt');
 return t}
const linksHTML=R=>{const t=R?linkTags(R):null,L=t?LINKS.filter(l=>t.has(l[2])):LINKS;return `<ul class="list">${L.map(l=>`<li><a href="${l[0]}" target="_blank" rel="noopener">${esc(l[1])}</a>${t?` <span class="note">: ${esc(LINK_WHY[l[2]])}</span>`:''}<br><span class="note">${esc(l[0].replace('https://',''))}</span></li>`).join('')}</ul>`};
/* okienko potwierdzenia: tekst, przycisk główny (akcja po zamknięciu); Esc lub tło zamyka i też wykonuje akcję */
function popup(html,btn,then){
 const ov=document.createElement('div');ov.className='overlay';ov.innerHTML=`<div class="popup" role="dialog" aria-modal="true" aria-labelledby="pph">${html}<div class="acts"><button class="btn pri" id="ppok">${esc(btn||'OK')}</button></div></div>`;
 document.body.appendChild(ov);const h=ov.querySelector('h3');if(h)h.id='pph';
 const close=()=>{ov.remove();document.removeEventListener('keydown',key);if(then)then()};
 const key=e=>{if(e.key==='Escape')close()};document.addEventListener('keydown',key);
 ov.onclick=e=>{if(e.target===ov)close()};ov.querySelector('#ppok').onclick=close;ov.querySelector('#ppok').focus()}
const page=(t,inner)=>`<div class="wrap"><h2 class="hi">${t}</h2>${inner}</div>`;
const needForm=()=>`<div class="empty">Najpierw uzupełnij formularz, a ta strona wypełni się sama. <button class="btn pri sm" data-goto="form">Przejdź do formularza</button></div>`;
const formDone=()=>{const s=seq();return S.order.length>0&&(!s.length||!s[s.length-1].cur)};
function bindGoto(){document.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>{const v=b.dataset.goto;if(v==='calc'){S.view='form';S.tab='wynik';S.m='panel'}else S.view=v;render()})}
