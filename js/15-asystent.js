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
const AGENT_RULES=()=>`Jesteś asystentem w prototypie aplikacji „Przewodnik przyszłego rodzica” (konkurs HackNation 2026, zadanie ZUS). Pomagasz przyszłym rodzicom zrozumieć zasiłki z ubezpieczenia chorobowego: chorobowy w ciąży, macierzyński (urlop macierzyński, uzupełniający, rodzicielski, ojcowski, na warunkach macierzyńskiego), wnioski, terminy i ryzyka.
Zasady:
- Odpowiadaj po polsku, prosto i krótko (zwykle 2–6 zdań lub krótka lista). Zwracaj się do użytkownika na „Ty”.
- Wszystkie liczby, daty, kwoty i uprawnienia bierz WYŁĄCZNIE z narzędzi get_case lub simulate. Nie licz w głowie i nie wymyślaj przepisów. Kwoty są orientacyjne.
- Pytania „co jeśli” licz narzędziem simulate i porównaj z obecnym wynikiem.
- set_answer używaj tylko, gdy użytkownik wyraźnie prosi o zmianę albo podaje nową informację o sobie; potem napisz, co zmieniłeś.
- Jeśli formularz nie jest kompletny, powiedz, czego brakuje (nastepne_pytanie) i zaproponuj uzupełnienie.
- Gdy czegoś nie ma w danych lub przepisy są niejasne, powiedz to wprost i zaproponuj kontakt z ZUS lub płatnikiem.
- W sytuacjach straty dziecka pisz z empatią i zaproponuj organizacje wsparcia (get_support).
- To prototyp: logowanie i dane ZUS są symulowane.
Dzisiaj jest ${TODAY}.`;
let agentCtl=null;
function agentStep(t){const el=$('#agstep');if(el)el.textContent=t}
function offlineAnswer(text){
const R=compute(),t=lc(text);
if(!formDone())return 'Najpierw uzupełnij formularz, wtedy policzę Twoją sytuację. Pełny asystent AI zadziała po wpisaniu klucza OpenRouter w ustawieniach obok.';
if(R.blocked)return 'Według formularza zasiłek nie przysługuje: '+R.blocked;
if(/ile|kwot|zł|pieni|dostan/.test(t))return 'Orientacyjnie:\n'+R.ben.filter(b=>b.m).map(b=>`• ${b.n}: ok. ${Math.round(b.m)} zł/mies. (${String(b.pct).replace('.',',')}%)`).join('\n');
if(/dokument|załącz|papier/.test(t))return R.att.length?'Przygotuj:\n'+R.att.map(a=>'• '+a.t).join('\n'):'Na tym etapie nie potrzebujesz dodatkowych dokumentów.';
if(/termin|kiedy|data|do kiedy/.test(t))return R.tl.length?'Najbliższe terminy:\n'+R.tl.filter(e=>diff(TODAY,e.d)>=0).slice(0,5).map(e=>`• ${fmt(e.d)}: ${e.t}`).join('\n'):'Brak terminów.';
if(/ryzyk|uwaga|zagro|stracić/.test(t))return R.risks.length?'Uważaj na:\n'+R.risks.map(r=>'• '+r.t.replace(/<[^>]+>/g,'')).join('\n'):'Nie widzę ryzyk w Twojej sytuacji.';
if(/wniosek|gdzie|złoż/.test(t)&&R.w)return `${R.w.name}. ${R.w.where}. ${R.w.when}`;
return 'Bez podłączonego modelu AI asystent odpowiada tylko na proste pytania: ile dostanę, jakie dokumenty, jakie terminy, jakie ryzyka, gdzie złożyć wniosek. Pełny asystent AI zadziała po wpisaniu klucza OpenRouter w ustawieniach obok.';
}
function renderAgent(){
const sug=['Ile dostanę miesięcznie?','Co się zmieni, jeśli drugi rodzic weźmie 12 tygodni rodzicielskiego?','Jakie dokumenty muszę przygotować?','Na co muszę uważać?','Wytłumacz mi wariant 81,5%'];
$('#app').innerHTML=page('Asystent AI',`<div class="cols ag"><div class="agbox"><div class="msgs" id="agm" aria-live="polite"></div><div class="agstep note" id="agstep"></div><div class="input"><div class="free"><input type="text" id="agin" aria-label="Pytanie do asystenta" placeholder="Zapytaj o swoją sytuację, np. „co jeśli wrócę do pracy na pół etatu?”"><button class="btn pri" id="agsend">Wyślij</button><button class="btn" id="agstop" hidden>Stop</button></div><div class="sug">${sug.map(s=>`<button class="opt" data-sug="${esc(s)}">${esc(s)}</button>`).join('')}</div></div></div>
<aside class="zcard"><h3>Co widzi asystent</h3><p class="note">Twoje dane z ZUS, odpowiedzi z formularza i wynik silnika reguł. Liczby bierze z kalkulatora, nie wymyśla ich. Zmienia odpowiedzi w formularzu tylko na Twoją prośbę.</p><ul class="facts kv2"><li><span>Formularz</span><strong>${formDone()?'kompletny':'w toku'}</strong></li><li><span>Wniosek</span><strong>${esc((compute().w||{}).name||'—')}</strong></li></ul><p class="note" id="agmode">Model: <strong>${esc(llmName())}</strong>${LLM?'':'. Tryb uproszczony: odpowiadam tylko na proste pytania.'}</p>
<details class="orset"${OR.key?'':' open'}><summary>Ustawienia AI (OpenRouter)</summary>
<label for="orkey">Klucz API OpenRouter</label><input type="password" id="orkey" autocomplete="off" placeholder="sk-or-..." value="${esc(OR.key)}">
<label for="ormodel">Model</label><input type="text" id="ormodel" list="ormodels" value="${esc(OR.model)}"><datalist id="ormodels">${OR_MODELS.map(m=>`<option value="${m}">`).join('')}</datalist>
<div class="acts"><button class="btn sm pri" id="orsave">Zapisz</button><button class="btn sm" id="ortest">Test połączenia</button>${OR.key?'<button class="btn sm" id="ordel">Usuń klucz</button>':''}</div><p class="note" id="ormsg"></p>
<p class="note">Klucz zapisuje się tylko w tej przeglądarce i trafia wyłącznie do openrouter.ai. Na pokaz użyj klucza z niskim limitem wydatków (ustawisz go na openrouter.ai). Identyfikatory modeli: openrouter.ai/models.</p></details><button class="btn sm" id="agclr">Wyczyść rozmowę</button></aside></div>`);
const draw=()=>{const m=$('#agm');m.innerHTML=(S.agent.length?'':`<div class="b bot">Cześć${S.p.manual?'':', '+esc(S.p.dane.imie)}! Znam Twoją sytuację z formularza. O co chcesz zapytać?</div>`)+S.agent.map(t=>`<div class="b ${t.role==='user'?'me':'bot'}">${esc(t.content)}</div>`).join('');m.scrollTop=m.scrollHeight};
draw();
const send=async(text)=>{text=(text||'').trim();if(!text||agentCtl)return;S.agent.push({role:'user',content:text});draw();$('#agin').value='';
 const m=$('#agm');m.insertAdjacentHTML('beforeend','<div class="b bot" id="agcur">Myślę…</div>');m.scrollTop=m.scrollHeight;
 let tools=null;try{const lim=LLM&&await LLM.limits();tools=lim&&lim.tools?AGENT_TOOLS():null}catch(e){}
 if(!LLM){const a=offlineAnswer(text);S.agent.push({role:'assistant',content:a});draw();return}
 agentCtl=new AbortController();$('#agstop').hidden=false;$('#agsend').disabled=true;
 const turns=[{role:'user',content:AGENT_RULES()+(tools?'':'\n\nNarzędzia są niedostępne. Dane sprawy (JSON):\n'+JSON.stringify(summarize(compute())).slice(0,12000))},{role:'assistant',content:'Rozumiem. Będę korzystać z danych sprawy.'},...S.agent.slice(-12)];
 try{const opts={signal:agentCtl.signal,modelTier:'quick',onText:({text})=>{const el=$('#agcur');if(el)el.textContent=text}};if(tools)opts.tools=tools;else opts.cache=false;
  const r=await LLM(turns,opts);const parts=r.text.split(/\n\s*\n/);S.agent.push({role:'assistant',content:r.text.trim()})}
 catch(e){if(e&&e.code==='not_granted'){LLM=null;S.agent.push({role:'assistant',content:'Bez zgody na użycie Claude działam w trybie uproszczonym. '+offlineAnswer(text)})}else if(e&&e.code==='cancelled'){if(e.text)S.agent.push({role:'assistant',content:e.text+' […]'})}else S.agent.push({role:'assistant',content:(e&&e.text?e.text+'\n\n':'')+(e&&e.code==='rate_limited'?'Za dużo pytań naraz, spróbuj za chwilę.':e&&e.code==='auth'?'Klucz OpenRouter jest nieprawidłowy. Popraw go w ustawieniach obok.':e&&e.code==='credits'?'Na koncie OpenRouter skończyły się środki.':'Nie udało się uzyskać odpowiedzi'+(e&&e.message?': '+e.message:'. Spróbuj ponownie.'))})}
 agentCtl=null;agentStep('');if(S.view==='asystent'){$('#agstop').hidden=true;$('#agsend').disabled=false;draw();if(S.agentChanged){S.agentChanged=false;$('#agstep').innerHTML='Asystent zmienił odpowiedzi w formularzu. <button class="btn sm" data-goto="form">Zobacz formularz</button>';bindGoto()}}};
$('#agsend').onclick=()=>send($('#agin').value);
$('#agin').onkeydown=e=>{if(e.key==='Enter')send($('#agin').value)};
$('#agstop').onclick=()=>{if(agentCtl)agentCtl.abort()};
$('#agclr').onclick=()=>{S.agent=[];draw()};
const orRead=()=>{OR.key=$('#orkey').value.trim();OR.model=$('#ormodel').value.trim()||OR_MODELS[0];lsSet('or_key',OR.key);lsSet('or_model',OR.model);pickLLM()};
$('#orsave').onclick=()=>{orRead();renderAgent()};
if($('#ordel'))$('#ordel').onclick=()=>{$('#orkey').value='';orRead();renderAgent()};
$('#ortest').onclick=async()=>{orRead();const m=$('#ormsg');if(!OR.key){m.textContent='Wpisz klucz.';return}m.textContent='Sprawdzam…';
 try{const r=await openRouterLLM()('Odpowiedz jednym słowem: OK',{maxTokens:20});m.textContent='Działa. Model '+OR.model+' odpowiedział: '+(r.text||'').trim().slice(0,40)}
 catch(e){m.textContent='Błąd: '+(e.code==='auth'?'nieprawidłowy klucz.':e.code==='credits'?'brak środków na koncie OpenRouter.':(e.message||e.code))}
 const am=$('#agmode');if(am)am.innerHTML='Model: <strong>'+esc(llmName())+'</strong>'};
document.querySelectorAll('[data-sug]').forEach(b=>b.onclick=()=>send(b.dataset.sug));
bindGoto();
}
