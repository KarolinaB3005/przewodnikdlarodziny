/* Asystent AI: narzędzia, zasady, tryb uproszczony, ekran rozmowy */
/* ---------- agent ---------- */
function summarize(R){
const c=ctx();
return {dzis:TODAY,osoba:c.p.manual?'brak danych z ZUS':{imie:c.p.dane.imie,forma:FORMA[c.forma]||null,platnik:c.platnik,platnik_ponad_20:c.ponad20,ubezpieczenie_od:c.od,umowa_do:c.koniec,dobrowolne_chorobowe:c.dobr,wynagrodzenie_brutto:c.brutto,ezla:c.ezla},
odpowiedzi:Object.fromEntries(Object.entries(S.A).filter(([k])=>k!=='spec_open')),
formularz_kompletny:formDone(),nastepne_pytanie:(()=>{const s=seq(),l=s[s.length-1];return l&&l.cur?{id:l.q.id,tekst:l.q.t(c)}:null})(),
wynik:{brak_prawa:R.blocked,wniosek:R.w,swiadczenia:R.ben.map(b=>({nazwa:b.n,od:b.od||null,do:b.do||null,wymiar:b.tyg||b.okr||null,stawka_proc:b.pct,kwota_mies_zl:b.m==null?null:Math.round(b.m),uwaga:b.note||null})),ryzyka:R.risks.map(r=>r.t.replace(/<[^>]+>/g,'')),dobre:R.good.map(r=>r.t),info:R.info.map(t=>t.replace(/<[^>]+>/g,'')),dokumenty:R.att.map(a=>a.t),terminy:R.tl.map(e=>({data:e.d,co:e.t})),reguly:[...R.fired]}};
}
function qList(){const c=ctx();return Q.map(q=>{let t='',o=null;try{t=q.t(c)}catch(e){}try{o=q.o?q.o(c).map(x=>x[0]+'='+x[1]):null}catch(e){}return {id:q.id,pytanie:t.slice(0,160),typ:q.type,opcje:o,aktywne:(()=>{try{return !!q.when(c)}catch(e){return false}})()}})}
function coerce(q,v,c){if(q.type==='yesno')return v===true||v==='true'||v==='tak';if(q.type==='number')return parseFloat(v);if(q.type==='multi')return Array.isArray(v)?v:String(v).split(',').map(s=>s.trim());return v}
const AGENT_TOOLS=()=>[
{name:'get_case',description:'Zwraca aktualną sytuację użytkownika: dane z ZUS, odpowiedzi z formularza i wynik silnika reguł (świadczenia z kwotami, wniosek, ryzyka, dokumenty, terminy). Używaj przed każdą odpowiedzią o uprawnieniach lub liczbach.',execute:()=>{agentStep('Sprawdzam Twoją sytuację…');return summarize(compute())}},
{name:'simulate',description:'Liczy wariant „co jeśli” bez zmiany formularza. Podaj obiekt zmian odpowiedzi, np. {"drugi":"rodz","drugi_tyg":12} albo {"w815":"100_70"}. Zwraca wynik jak get_case.',inputSchema:{type:'object',properties:{zmiany:{type:'object',description:'id pytania -> wartość (patrz list_questions)'}},required:['zmiany']},execute:(inp)=>{agentStep('Liczę wariant…');const z=inp&&inp.zmiany||{};const bak=S.A;S.A={...S.A};const c=ctx();for(const [k,v] of Object.entries(z)){const q=qById[k];if(q)S.A[k]=coerce(q,v,c)}let out;try{out=summarize(compute())}finally{S.A=bak}return out}},
{name:'set_answer',description:'Zmienia odpowiedź w formularzu użytkownika. Używaj TYLKO, gdy użytkownik wprost poprosi o zmianę lub poda nową informację o sobie. Zwraca nowy wynik.',inputSchema:{type:'object',properties:{id:{type:'string'},value:{description:'wartość zgodna z typem pytania'}},required:['id','value']},execute:(inp)=>{const q=qById[String(inp.id)];if(!q)throw new Error('Nie ma pytania '+inp.id);const c=ctx();const v=coerce(q,inp.value,c);const err=q.type==='multi'||(q.type==='text'&&q.id!=='konto')?'':validOf(q,v,c);if(err)throw new Error(err==='empty'?'Nieprawidłowa wartość':err);S.A[q.id]=v;delete S.raw[q.id];S.auto[q.id]=1;S.order=S.order.filter(x=>x!==q.id);S.order.push(q.id);agentStep('Zmieniam w formularzu: '+q.id+' = '+label(q,v));S.agentChanged=true;return summarize(compute())}},
{name:'list_questions',description:'Lista pytań formularza: id, treść, typ, dozwolone wartości (wartość=etykieta) i czy pytanie jest teraz aktywne.',execute:()=>qList()},
{name:'get_support',description:'Lista organizacji wspierających rodziców (wcześniaki, choroba dziecka, strata dziecka) i przydatnych stron.',execute:()=>({organizacje:SUPPORT,strony:LINKS})},
{name:'get_parameters',description:'Parametry kalkulatora (stawki, wymiary urlopów w tygodniach, minimalny zasiłek). Mogą być zmienione przez administratora.',execute:()=>CFG}
];
const AGENT_RULES=()=>`Jesteś ciepłym, konkretnym asystentem w prototypie aplikacji „Przewodnik przyszłego rodzica” (konkurs HackNation 2026, zadanie ZUS). Pomagasz przyszłym i świeżo upieczonym rodzicom zrozumieć zasiłki z ubezpieczenia chorobowego: chorobowy w ciąży, macierzyński (urlop macierzyński, uzupełniający, rodzicielski, ojcowski, na warunkach macierzyńskiego), wnioski, terminy i ryzyka.
Styl:
- Rozmawiaj naturalnie i po ludzku, jak życzliwa osoba, która zna temat: możesz się przywitać, nawiązać do tego, co użytkownik napisał wcześniej, dopytać, gdy pytanie jest niejasne, i zaproponować kolejny krok. Pisz po polsku, na „Ty”.
- Dopasuj długość do pytania: na krótkie odpowiadaj krótko (2–4 zdania), przy wyjaśnieniach możesz użyć krótkiej listy. Bez urzędniczego żargonu; jeśli używasz pojęcia (np. „podstawa wymiaru”), wyjaśnij je jednym zdaniem.
- Możesz tłumaczyć ogólne zasady (np. czym różni się urlop macierzyński od rodzicielskiego), podawać przykłady i porady praktyczne (jak się przygotować, co załatwić najpierw).
- Na pytania niezwiązane z tematem (żarty, pytania od czapy) odpowiedz krótko, z lekkim humorem i życzliwie, a potem wróć do spraw rodzicielskich i zaproponuj, w czym możesz pomóc.
Twarde zasady (zawsze):
- Liczby, daty, kwoty i uprawnienia użytkownika bierz WYŁĄCZNIE z narzędzi get_case lub simulate. Nie licz w głowie i nie wymyślaj przepisów ani wartości. Kwoty są orientacyjne.
- Pytania „co jeśli” licz narzędziem simulate i porównaj z obecnym wynikiem.
- set_answer używaj tylko, gdy użytkownik wyraźnie prosi o zmianę albo podaje nową informację o sobie; potem napisz, co zmieniłeś.
- Jeśli formularz nie jest kompletny, powiedz, czego brakuje (nastepne_pytanie) i zachęć do uzupełnienia, ale mimo to odpowiedz na pytanie ogólnie, na ile się da.
- Gdy czegoś nie ma w danych lub przepisy są niejasne, powiedz to wprost i zaproponuj kontakt z ZUS lub płatnikiem.
- W sytuacjach straty dziecka pisz spokojnie i z empatią, bez żartów, i zaproponuj organizacje wsparcia (get_support).
- To prototyp: logowanie i dane ZUS są symulowane.
Dzisiaj jest ${TODAY}.`;
let agentCtl=null;
function agentStep(t){const el=$('#agstep');if(el)el.textContent=t}
function offlineAnswer(text){
const R=compute(),t=lc(text);
if(!formDone())return 'Najpierw uzupełnij formularz, wtedy policzę Twoją sytuację.';
if(R.blocked)return 'Według formularza zasiłek nie przysługuje: '+R.blocked;
if(/ile|kwot|zł|pieni|dostan/.test(t))return 'Orientacyjnie:\n'+R.ben.filter(b=>b.m).map(b=>`• ${b.n}: ok. ${Math.round(b.m)} zł/mies. (${String(b.pct).replace('.',',')}%)`).join('\n');
if(/dokument|załącz|papier/.test(t))return R.att.length?'Przygotuj:\n'+R.att.map(a=>'• '+a.t).join('\n'):'Na tym etapie nie potrzebujesz dodatkowych dokumentów.';
if(/termin|kiedy|data|do kiedy/.test(t))return R.tl.length?'Najbliższe terminy:\n'+R.tl.filter(e=>diff(TODAY,e.d)>=0).slice(0,5).map(e=>`• ${fmt(e.d)}: ${e.t}`).join('\n'):'Brak terminów.';
if(/ryzyk|uwaga|zagro|stracić/.test(t))return R.risks.length?'Uważaj na:\n'+R.risks.map(r=>'• '+r.t.replace(/<[^>]+>/g,'')).join('\n'):'Nie widzę ryzyk w Twojej sytuacji.';
if(/wniosek|gdzie|złoż/.test(t)&&R.w)return `${R.w.name}. ${R.w.where}. ${R.w.when}`;
return 'W trybie uproszczonym odpowiadam tylko na proste pytania: ile dostanę, jakie dokumenty, jakie terminy, jakie ryzyka, gdzie złożyć wniosek.';
}
function renderAgent(){
const sug=['Ile dostanę miesięcznie?','Co się zmieni, jeśli drugi rodzic weźmie 12 tygodni rodzicielskiego?','Jakie dokumenty muszę przygotować?','Na co muszę uważać?','Wytłumacz mi wariant 81,5%'];
$('#app').innerHTML=page('Asystent AI',`<div class="cols ag"><div class="agbox"><div class="msgs" id="agm" aria-live="polite"></div><div class="agstep note" id="agstep"></div><div class="input"><div class="free"><input type="text" id="agin" aria-label="Pytanie do asystenta" placeholder="Zapytaj o swoją sytuację, np. „co jeśli wrócę do pracy na pół etatu?”"><button class="btn pri" id="agsend">Wyślij</button><button class="btn" id="agstop" hidden>Stop</button></div><div class="sug">${sug.map(s=>`<button class="opt" data-sug="${esc(s)}">${esc(s)}</button>`).join('')}</div></div></div>
<aside class="zcard"><h3>Co widzi asystent</h3><p class="note">Twoje dane z ZUS, odpowiedzi z formularza i wynik silnika reguł. Liczby bierze z kalkulatora, nie wymyśla ich. Zmienia odpowiedzi w formularzu tylko na Twoją prośbę.</p><ul class="facts kv2"><li><span>Formularz</span><strong>${formDone()?'kompletny':'w toku'}</strong></li><li><span>Wniosek</span><strong>${esc((compute().w||{}).name||'—')}</strong></li></ul><p class="note" id="agmode">${LLM?'<span class="agtag ai">AI aktywne</span> Rozmawiaj swobodnie: rozumiem pytania pisane własnymi słowami.':'Tryb uproszczony: odpowiadam na proste pytania (ile dostanę, dokumenty, terminy, ryzyka, gdzie złożyć wniosek).'}</p><button class="btn sm" id="agclr">Wyczyść rozmowę</button></aside></div>`);
const draw=()=>{const m=$('#agm');m.innerHTML=(S.agent.length?'':`<div class="b bot">Cześć${S.p.manual?'':', '+esc(S.p.dane.imie)}! Znam Twoją sytuację z formularza. O co chcesz zapytać?</div>`)+S.agent.map(t=>`<div class="b ${t.role==='user'?'me':'bot'}">${esc(t.content)}${t.role!=='user'&&t.src?`<span class="agtag ${t.src}">${t.src==='ai'?'odpowiedź AI':'odpowiedź awaryjna (bez AI)'}</span>`:''}</div>`).join('');m.scrollTop=m.scrollHeight};
draw();
const send=async(text)=>{text=(text||'').trim();if(!text||agentCtl)return;S.agent.push({role:'user',content:text});draw();$('#agin').value='';
 const m=$('#agm');m.insertAdjacentHTML('beforeend','<div class="b bot" id="agcur">Myślę…</div>');m.scrollTop=m.scrollHeight;
 let tools=null;try{const lim=LLM&&await LLM.limits();tools=lim&&lim.tools?AGENT_TOOLS():null}catch(e){}
 if(!LLM){const a=offlineAnswer(text);S.agent.push({role:'assistant',content:a,src:'fallback'});draw();return}
 agentCtl=new AbortController();$('#agstop').hidden=false;$('#agsend').disabled=true;
 const turns=[{role:'user',content:AGENT_RULES()+(tools?'':'\n\nNarzędzia są niedostępne. Dane sprawy (JSON):\n'+JSON.stringify(summarize(compute())).slice(0,12000))},{role:'assistant',content:'Rozumiem. Będę korzystać z danych sprawy.'},...S.agent.slice(-12).map(t=>({role:t.role,content:t.content}))];
 try{const opts={signal:agentCtl.signal,modelTier:'quick',onText:({text})=>{const el=$('#agcur');if(el)el.textContent=text}};if(tools)opts.tools=tools;else opts.cache=false;
  const r=await LLM(turns,opts);S.agent.push({role:'assistant',content:(r.text||'').trim()||offlineAnswer(text),src:(r.text||'').trim()?'ai':'fallback'})}
 catch(e){if(e&&e.code==='not_granted'){LLM=null;S.agent.push({role:'assistant',content:'Bez zgody na użycie Claude działam w trybie uproszczonym. '+offlineAnswer(text),src:'fallback'})}else if(e&&e.code==='cancelled'){if(e.text)S.agent.push({role:'assistant',content:e.text+' […]'})}else{console.warn('Asystent AI: błąd, używam odpowiedzi awaryjnej.',e);const why=e&&e.code==='rate_limited'?'za dużo pytań naraz':e&&e.code==='auth'?'nieprawidłowy klucz w konfiguracji':e&&e.code==='network'?'brak połączenia':e&&e.code==='credits'?'brak środków na koncie AI':'chwilowa awaria';S.agent.push({role:'assistant',content:`Asystent AI jest chwilowo niedostępny (${why}), więc odpowiadam w trybie awaryjnym:\n\n`+offlineAnswer(text),src:'fallback'})}}
 agentCtl=null;agentStep('');if(S.view==='asystent'){$('#agstop').hidden=true;$('#agsend').disabled=false;draw();if(S.agentChanged){S.agentChanged=false;$('#agstep').innerHTML='Asystent zmienił odpowiedzi w formularzu. <button class="btn sm" data-goto="form">Zobacz formularz</button>';bindGoto()}}};
$('#agsend').onclick=()=>send($('#agin').value);
$('#agin').onkeydown=e=>{if(e.key==='Enter')send($('#agin').value)};
$('#agstop').onclick=()=>{if(agentCtl)agentCtl.abort()};
$('#agclr').onclick=()=>{S.agent=[];draw()};
document.querySelectorAll('[data-sug]').forEach(b=>b.onclick=()=>send(b.dataset.sug));
bindGoto();
}
