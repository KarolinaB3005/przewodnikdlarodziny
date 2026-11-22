/* Rozmowa w formularzu: podpowiedzi, wysyłanie odpowiedzi, renderowanie czatu */
const HELP={
utrata:'Jeśli w czasie ciąży umowę o pracę rozwiązano z powodu upadłości lub likwidacji pracodawcy i nie zapewniono Ci innej pracy, albo rozwiązano ją z naruszeniem przepisów (potwierdza to prawomocny wyrok), do dnia porodu przysługuje zasiłek w wysokości zasiłku macierzyńskiego, czyli 100% podstawy.',
drugi_brutto:'Na tej podstawie policzę orientacyjny zasiłek drugiego rodzica za jego część urlopu. Dokładną podstawę ustali jego płatnik albo ZUS.',
zazycie:'Zaświadczenie „Za życiem” wystawia lekarz specjalista (m.in. położnictwa i ginekologii, perinatologii lub neonatologii), gdy w czasie ciąży lub porodu stwierdzi u dziecka ciężkie i nieodwracalne upośledzenie albo nieuleczalną chorobę zagrażającą życiu. Takie zaświadczenie wydłuża m.in. urlop rodzicielski. Jeśli lekarz nie mówił o takiej diagnozie, najpewniej Was to nie dotyczy i możesz wybrać „Nie”.',
w815:c=>`Są dwa sposoby wypłaty zasiłku. Pierwszy: ${CFG.stMac}% podstawy przez urlop macierzyński, a potem ${CFG.stRodz}% przez rodzicielski. Drugi: od razu cały czas po ${pc(CFG.st815)}%, czyli mniej na początku, ale więcej później. Przy pełnym wykorzystaniu obu urlopów łączna kwota wychodzi podobnie. Na drugi wariant trzeba złożyć wniosek najpóźniej ${CFG.okno815} dni po porodzie.`,
drugi:c=>`Urlop rodzicielski to wspólna pula dla obojga rodziców (${c.pool} tyg.). ${CFG.nieprzen} tygodni z niej przysługuje tylko drugiemu rodzicowi: jeśli ich nie weźmie, przepadają. Rodzice mogą korzystać z urlopu na zmianę albo w tym samym czasie.`,
drugi_tyg:c=>`Drugi rodzic musi wziąć co najmniej ${CFG.nieprzen} tyg., żeby ich nie stracić. Każdy tydzień, który weźmie ponad to, zmniejsza Twoją część puli.`,
tata_tyg:c=>`${CFG.nieprzen} tygodni urlopu rodzicielskiego przysługuje tylko Tobie i nie można ich oddać mamie. Zasiłek za ten czas to ${CFG.stRodz}% podstawy (albo ${pc(CFG.st815)}%, jeśli mama wybrała wariant jednolity).`,
laczenie:'W czasie urlopu rodzicielskiego możesz pracować u swojego pracodawcy na część etatu, maksymalnie na pół. Urlop wydłuża się wtedy proporcjonalnie, a zasiłek dostajesz za część czasu, w której nie pracujesz.',
start_przed:c=>`Urlop macierzyński możesz zacząć do ${CFG.przedTyg} tygodni przed przewidywanym terminem porodu. Te tygodnie nie przepadają, tylko skracają część urlopu po porodzie. Potrzebne jest zaświadczenie lekarskie o terminie porodu.`,
hosp:'Jeśli dziecko urodzi się przedwcześnie albo po porodzie wymaga leczenia w szpitalu, przysługuje dodatkowy, uzupełniający urlop macierzyński. Bierze go mama albo tata, bezpośrednio po zwykłym urlopie macierzyńskim.',
ponad20_m:'Jeśli płatnik zgłasza do ubezpieczenia chorobowego więcej niż 20 osób, sam ustala prawo do zasiłku i go wypłaca. Przy mniejszych firmach płatnik przesyła dokumenty do ZUS, a zasiłek wypłaca ZUS. Jeśli nie wiesz, zapytaj w kadrach albo wybierz „Nie wiem”.',
dobr_m:'Przy zleceniu i własnej działalności ubezpieczenie chorobowe jest dobrowolne: trzeba się do niego zgłosić i płacić składkę. Bez niego nie dostaniesz ani zasiłku chorobowego, ani macierzyńskiego. Sprawdzisz to na eZUS albo w deklaracjach składek.',
koniec_m:'Umowa na czas nieokreślony nie ma daty końca. Umowa na czas określony albo zlecenie mają w treści datę, do kiedy obowiązują. To ważne, bo w dniu porodu musisz być ubezpieczona.',
mama_ubezp:'Chodzi o to, czy w dniu porodu mama dziecka była objęta ubezpieczeniem chorobowym, np. pracowała na umowę o pracę albo opłacała dobrowolne chorobowe. Jeśli nie była, tata i tak może skorzystać z urlopu rodzicielskiego.',
mama_status:'Tata może przejąć urlop macierzyński wcześniej niż po 14 tygodniach tylko w szczególnych sytuacjach: gdy mama jest w szpitalu, ma orzeczenie o niezdolności do samodzielnej egzystencji, zmarła albo porzuciła dziecko.',
typ_zast:'Rodzina zastępcza zawodowa pełni tę funkcję zawodowo, na podstawie umowy i za wynagrodzeniem. Urlop i zasiłek przysługują tylko rodzinie zastępczej niezawodowej, np. krewnym, którzy przyjęli dziecko.',
sad:'Przy adopcji urlop i zasiłek przysługują dopiero wtedy, gdy przyjęliście dziecko na wychowanie i złożyliście w sądzie wniosek o jego przysposobienie, czyli adopcję.',
zus_ok:'Pokazuję dane, które ZUS ma o Twoim ubezpieczeniu (w prototypie symulowane). Jeśli coś się zmieniło, np. masz nową pracę albo inną umowę, odpowiedz „Nie”, a dopytam o szczegóły.',
l4:'L4 to zwolnienie lekarskie. W ciąży lekarz oznacza je kodem „B” i wtedy zasiłek chorobowy wynosi 100% podstawy.',
zmiana:'Pytam, bo w dniu porodu musisz być ubezpieczona. Jeśli umowa skończy się przed porodem albo zmienisz pracę z przerwą, możesz stracić prawo do zasiłku macierzyńskiego.',
termin:'Przewidywany termin porodu wpisał lekarz w karcie ciąży. Możesz też napisać, w którym jesteś tygodniu ciąży, a policzę termin orientacyjnie.',
liczba:'Przy bliźniętach i większej liczbie dzieci z jednego porodu urlop macierzyński i rodzicielski są dłuższe.',
zus_fix:'Zaznacz, które dane z ZUS są nieaktualne, albo napisz, co się zmieniło, np. „od września pracuję na zleceniu w innej firmie”.',
forma_m:'Umowa o pracę to etat. Zlecenie to umowa cywilna. Działalność to własna firma. Od tego zależy, jaki wniosek składasz i komu.'
};
const helpOf=(q,c)=>{const v=HELP[q.base||q.id];return v?(typeof v==='function'?v(c):v):''};
const isHelp=t=>/(\?\s*$|co to|co znaczy|co oznacza|nie rozumiem|wyjaśnij|wytłumacz|o co chodzi|czym jest|po co|dlaczego pyta)/.test(lc(t));
async function sendFree(q,text){
 text=text.trim();if(!text||S.busy)return;
 const c=ctx();S.hint='';
 if(isHelp(text)){let ex=helpOf(q,c);
  if(!ex&&LLM){S.busy=true;try{const r=await LLM(`Wyjaśnij krótko (2–3 zdania), prostym językiem po polsku, o co chodzi w tym pytaniu z kreatora wniosku o zasiłek macierzyński w Polsce. Pytanie: "${q.t(c)}". Użytkownik zapytał: "${text.slice(0,300)}". Nie podawaj liczb, których nie jesteś pewien.`,{modelTier:'quick',cache:false});ex=r&&r.text}catch(e){}S.busy=false}
  S.hint=(ex||'To pytanie pomaga ustalić, jaki wniosek będzie Ci potrzebny i ile wyniesie zasiłek.')+'\n\nMożesz teraz odpowiedzieć albo wybrać „Nie wiem”, jeśli jest taka opcja.';S.hintKind='help';S.hintText=text;renderWork(true);return}
 S.hintKind='';S.busy=true;
 const box=$('#msgs');box.insertAdjacentHTML('beforeend',`<div class="b me new">${esc(text)}</div><div class="b info new" id="thinking">Analizuję odpowiedź…</div>`);box.scrollTop=box.scrollHeight;
 document.querySelectorAll('#inp button,#inp input').forEach(e=>e.disabled=true);
 let v=null,ask='';
 try{
  if(q.type==='multi'){
   let res=fixExtract(text);
   if(LLM){const r=await askLLM(q,text,c);const rv=r&&r.value;if(rv&&Array.isArray(rv.fields)&&rv.fields.length){res={fields:rv.fields.filter(f=>['forma','platnik','od','koniec','dobr','brutto'].includes(f)),vals:Object.assign({},res.vals,rv.vals||{})}}else if(r&&r.dopytaj&&!res.fields.length)ask=r.dopytaj}
   if(res.fields.length){S.busy=false;applyFix(res,text);return}
  }else{
   v=local(q,text,c);
   if(validOf(q,v,c)==='empty'&&LLM){const r=await askLLM(q,text,c);if(r){if(r.value!==null&&r.value!==undefined&&(r.pewnosc===undefined||r.pewnosc>=0.55)){v=q.type==='number'?parseFloat(r.value):r.value}else ask=r.dopytaj||''}}
   const err=validOf(q,v,c);
   if(!err){S.busy=false;S.raw[q.id]=text;answer(q.id,v);return}
   if(err!=='empty')ask=err;
  }
 }catch(e){}
 S.busy=false;S.hint=ask||(q.type==='multi'?'Nie wiem jeszcze, co się zmieniło. Zaznacz pola powyżej albo opisz to inaczej, np. „mam nową pracę od 1 września”.':'Nie udało mi się tego zrozumieć. Wybierz jedną z opcji albo napisz inaczej.');
 S.hintText=text;renderWork(true)}
function applyFix(res,text){
 const c=ctx();S.A.zus_fix=res.fields;S.raw.zus_fix=text;S.order=S.order.filter(x=>x!=='zus_fix');S.order.push('zus_fix');
 for(const [k,v] of Object.entries(res.vals||{})){const q=qById[k];if(!q)continue;if(k==='platnik_m'&&typeof v==='string'&&v.trim()){S.A[k]=v.trim();S.auto[k]=1;S.order.push(k);continue}
  const vv=q.type==='number'?parseFloat(v):v;if(!validOf(q,vv,c)){S.A[k]=vv;S.auto[k]=1;S.order.push(k)}}
 S.hint='';renderWork(true)}
function answer(id,v){S.hint='';S.A[id]=v;S.order=S.order.filter(x=>x!==id);S.order.push(id);if(id==='spec'&&v==='anuluj'){delete S.A.spec_open;delete S.A.spec}renderWork(true)}
function forget(id){delete S.A[id];delete S.raw[id];delete S.auto[id];S.order=S.order.filter(x=>x!==id);if(id==='spec_open'||id==='spec'){delete S.A.spec;delete S.A.spec_open}}
function undo(){const id=S.order[S.order.length-1];if(!id)return;forget(id);S.hint='';renderWork(true)}

function renderWork(scroll){
const s=seq(),c=ctx(),done=!s.length||!s[s.length-1].cur;
let h='';
for(const it of s){
 h+=`<div class="b bot">${esc(it.q.t(c))}</div>`;
 if(!it.cur){const raw=S.raw[it.q.id],lab=label(it.q,it.a);h+=`<div class="b me edit" data-ed="${it.q.id}" title="Kliknij, aby zmienić">${esc(raw||lab)}${S.auto[it.q.id]?'<span class="auto">z Twojego opisu</span>':''}</div>`;if(raw&&lc(raw)!==lc(lab))h+=`<div class="b info">${it.q.id==='zus_fix'?'Rozumiem, zmieniło się: ':'Rozumiem: '}${esc(lab)}</div>`;if(it.q.after&&it.a){const af=it.q.after(c,it.a);if(af)h+=`<div class="b info">${esc(af)}</div>`}if(it.a==='niewiem'){const ex=helpOf(it.q,c);if(ex)h+=`<div class="b bot">${esc(ex)}\n\nNa razie liczę bez tego. Jeśli coś się wyjaśni, kliknij swoją odpowiedź, żeby ją zmienić.</div>`}}
}
const R=compute();
if(done){h+=`<div class="b bot new">${R.blocked?'Na podstawie Twoich odpowiedzi i danych z ZUS zasiłek nie przysługuje. W panelu wyjaśniam dlaczego i co możesz zrobić.':R.w?`Gotowe. Twój wniosek: ${R.w.name}.\n${R.w.where.replace(/\.$/,'')}.\nZebrane dane są w profilu i posłużą do kolejnych wniosków.`:'Gotowe. Szczegóły są w panelu obok.'}</div>`}
if(S.hint&&!done){h+=`<div class="b me">${esc(S.hintText||'')}</div><div class="b ${S.hintKind==='help'?'bot':'info'}">${esc(S.hint)}</div>`}
$('#msgs').innerHTML=h;
const last=s[s.length-1];
let inp='';
/* przykład w podpowiedzi zależny od jednostki pytania liczbowego */
const PH_NUM={'zł':'…albo napisz, np. „około 6 tys. zł”','tyg.':'…albo napisz, np. „12 tygodni”','lat':'…albo napisz, np. „3 lata”'};
const PH={date:'…albo napisz, np. „30 listopada” lub „za 6 tygodni”',number:'…albo napisz liczbę',multi:'…albo opisz, co się zmieniło',choice:'…albo odpowiedz własnymi słowami',yesno:'…albo odpowiedz własnymi słowami'};
if(last&&last.cur){const q=last.q;
 if(q.type==='choice')inp=q.o(c).map(o=>`<button class="opt" data-v="${esc(o[0])}">${esc(o[1])}</button>`).join('');
 else if(q.type==='yesno')inp='<button class="opt" data-v="1">Tak</button><button class="opt" data-v="0">Nie</button>';
 else if(q.type==='multi')inp=q.o(c).map(o=>`<button class="opt chipm" aria-pressed="false" data-mv="${esc(o[0])}">${esc(o[1])}</button>`).join('')+'<button class="btn pri" id="mok">Dalej</button>';
 else if(q.type==='date'){const mn=q.id==='data_zgonu'&&S.A.data_porodu?S.A.data_porodu:(q.min!==undefined?addD(TODAY,q.min):''),mx=q.max!==undefined?addD(TODAY,q.max):'';inp=`<input type="date" id="in" aria-label="Data"${mn?` min="${mn}"`:''}${mx?` max="${mx}"`:''}><button class="btn pri" id="ok">Dalej</button>`}
 else if(q.type==='number'){const mx=typeof q.max==='function'?q.max(c):q.max,df=typeof q.def==='function'?q.def(c):q.def;inp=`<input type="number" id="in" min="${q.min}" max="${mx}" value="${df}" aria-label="Liczba"> <span>${esc(q.unit||'')}</span><button class="btn pri" id="ok">Dalej</button>`}
 if(q.type==='text')inp=`<div class="free"><input type="text" id="ft" aria-label="Odpowiedź" placeholder="${q.id==='konto'?'np. PL61 1090 1014 0000 0712 1981 2874':'Wpisz odpowiedź'}"><button class="btn pri" id="fts">Wyślij</button>${q.opt?'<button class="btn" id="skip">Pomiń</button>':''}</div>`;
 else inp+=`<div class="free"><input type="text" id="ft" aria-label="Odpowiedź własnymi słowami" placeholder="${esc(q.type==='number'?(PH_NUM[q.unit]||PH.number):(PH[q.type]||'…albo napisz'))}"><button class="btn" id="fts">Wyślij</button></div>`;
 if(HELP[q.base||q.id])inp+='<button class="btn sm" id="hlp">Co to znaczy?</button>';inp+='<div class="err" id="er"></div>';
}else inp=`<button class="btn pri" id="toPanel">Zobacz wniosek i wynik</button><span class="note">Kliknij swoją odpowiedź w rozmowie, aby ją zmienić.</span>`;
$('#inp').innerHTML=inp;
if(last&&last.cur){const q=last.q;
 document.querySelectorAll('#inp [data-v]').forEach(b=>b.onclick=()=>answer(q.id,q.type==='yesno'?b.dataset.v==='1':b.dataset.v));
 document.querySelectorAll('#inp [data-mv]').forEach(b=>b.onclick=()=>b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true'));
 if($('#mok'))$('#mok').onclick=()=>{const sel=[...document.querySelectorAll('#inp [data-mv][aria-pressed=true]')].map(b=>b.dataset.mv);if(!sel.length){$('#er').textContent='Zaznacz, co się zmieniło, albo opisz to poniżej.';return}answer(q.id,sel)};
 const go=()=>{const el=$('#in'),er=$('#er');let v=el.value.trim();
  if(q.type==='date'){const e=validDate(q,v);if(e){er.textContent=e;return}}
  if(q.type==='number'){v=v===''?null:+v;const e=validOf(q,v,c);if(e){er.textContent=e==='empty'?'Wpisz liczbę.':e;return}}
  answer(q.id,v)};
 if($('#ok')){$('#ok').onclick=go;$('#in').onkeydown=e=>{if(e.key==='Enter')go()};$('#in').oninput=()=>{$('#er').textContent=''}}
 const fs=()=>{const t=$('#ft').value;if(!t.trim()){$('#er').textContent='Wpisz odpowiedź.';return}sendFree(q,t)};
 if($('#fts')){$('#fts').onclick=fs;$('#ft').onkeydown=e=>{if(e.key==='Enter')fs()};$('#ft').oninput=()=>{$('#er').textContent=''}}
 if($('#skip'))$('#skip').onclick=()=>answer(q.id,'');
 if($('#hlp'))$('#hlp').onclick=()=>{S.hint=helpOf(q,c)+'\n\nMożesz teraz odpowiedzieć albo wybrać „Nie wiem”, jeśli jest taka opcja.';S.hintKind='help';S.hintText='Co to znaczy?';renderWork(true)};
}
if($('#toPanel'))$('#toPanel').onclick=()=>{S.m='panel';renderWork()};
document.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{forget(b.dataset.ed);S.hint='';renderWork(true)});
$('#work').className='work m-'+S.m;
document.querySelectorAll('.mtabs button').forEach(b=>b.classList.toggle('pri',b.dataset.m===S.m));
renderPanel(R);
if(scroll){const m=$('#msgs');m.scrollTop=m.scrollHeight;const lb=m.lastElementChild;if(lb)lb.classList.add('new')}
}
