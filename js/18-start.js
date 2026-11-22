/* Główny render(), punkt wejścia dla testów i uruchomienie aplikacji */
function render(){
header();
if(S.view==='profiles'||!S.p&&S.view!=='login'){S.view='profiles';renderProfiles();return}
if(S.view==='login'){renderPass();return}
if(S.view==='home'){renderHome();return}
const V={ezus:renderEzus,akt:renderAkt,kalendarz:renderKalendarz,dokumenty:renderDokumenty,wnioski:renderWnioski,pomoc:renderPomoc,asystent:renderAgent,sprawa:renderSprawa};
if(V[S.view]){V[S.view]();window.scrollTo(0,0);return}
$('#app').innerHTML=`<div class="mtabs"><button class="btn" data-m="chat">Czat</button><button class="btn" data-m="panel">Wniosek i wynik</button></div>
<div class="work" id="work"><section class="chat"><div class="chead"><h2>Rozmowa</h2><button class="btn sm" id="un">Cofnij</button><button class="btn sm" id="sp">Sytuacja szczególna</button>${S.p.sc?'<button class="btn sm" id="ex" title="Wypełnij przykładowymi odpowiedziami">Przykład</button>':''}<button class="btn sm" id="rs">Od nowa</button></div><div class="msgs" id="msgs" aria-live="polite"></div><div class="input" id="inp"></div></section>
<aside class="panel"><div class="tabs" id="tabs" role="tablist"></div><div class="pbody" id="pbody"></div></aside></div>
<div class="foot">Prototyp stworzony na potrzeby HackNation TEAM PANDA, nie jest serwisem ZUS. Osoby testowe i ich dane są zmyślone; wyliczenia orientacyjne.</div>`;
$('#un').onclick=undo;
$('#rs').onclick=()=>{S.A={};S.order=[];S.raw={};S.auto={};S.hint='';S.m='chat';renderWork(true)};
$('#sp').onclick=()=>{if(!S.A.spec_open){S.A.spec_open=true;S.order.push('spec_open')}S.m='chat';renderWork(true)};
if($('#ex'))$('#ex').onclick=()=>{S.A={};S.order=[];S.raw={};S.auto={};S.hint='';for(const [k,v] of Object.entries(S.p.sc)){S.A[k]=v;S.order.push(k)}S.tab='wynik';S.m='panel';renderWork(true)};
document.querySelectorAll('.mtabs button').forEach(b=>b.onclick=()=>{S.m=b.dataset.m;renderWork()});
renderWork(true);
}

/* punkt wejścia dla testów automatycznych (tests/*.spec.js) */
window.__przewodnik={get S(){return S},PERS,CFG,RULES,
 compute:()=>{const R=compute();return {...R,fired:[...R.fired].sort()}},
 load:(pid,answers,view,mode)=>{const p=PERS.find(x=>x.id===pid);S={...fresh(),p,view:view||'form',tab:'wynik',m:mode||'panel'};const a=answers===undefined?(p.sc||{}):answers;for(const [k,v] of Object.entries(a)){S.A[k]=v;S.order.push(k)}render();return true},
 set:(k,v)=>{S.A[k]=v;S.order=S.order.filter(x=>x!==k);S.order.push(k);render()},
 next:()=>{const s=seq(),l=s[s.length-1];return l&&l.cur?l.q.id:null},
 dateIn:(t,id)=>dateIn(t,id?qById[id]:null),numIn,yesNo,isHelp,
 choiceIn:(id,t)=>choiceIn(qById[id],t,ctx()),fixExtract,
 validDate:(id,v)=>validDate(qById[id],v),today:()=>TODAY,
 doc:()=>{const R=compute();return R.w?wniosekDoc(R):null},
 debtOn:d=>debtOn(ctx(),d),linkTags:()=>{const t=linkTags(compute());return t?[...t].sort():null},zaswHTML:i=>zaswHTML(S.zadlZasw[i])};
render();
