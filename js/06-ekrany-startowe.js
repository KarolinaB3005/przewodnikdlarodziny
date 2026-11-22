/* Ikony, menu, nagłówek, wybór profilu, logowanie, pulpit */
const ICON={zus:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h4M14 13h4"/>',akt:'<path d="M6 3h12v13H6z"/><path d="M9 7h6M9 10h6"/><circle cx="12" cy="17" r="2.5"/><path d="M10.6 19 10 22l2-1 2 1-.6-3"/>',bot:'<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16h5"/>',pdf:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-5M14 11v5h1a2 2 0 0 0 0-4h-1"/>',wnioski:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',kal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',dok:'<path d="M6 4h9l3 3v13H6z"/><path d="M9 11h6M9 15h4"/>',msg:'<path d="M4 6h16v10H9l-5 4z"/>',chev:'<path d="M9 5l7 7-7 7"/>',back:'<path d="M15 5l-7 7 7 7"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'};
const ico=(k,s=22)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const ini=p=>((p.dane.imie||'')[0]||'')+((p.dane.nazwisko||'')[0]||'');
const nm=p=>(p.dane.imie+' '+p.dane.nazwisko).trim();
const LOGO='<img class="logo" alt="" src="assets/logo.png">';
const SIM='<div class="sim">Sim-logowania. Prototyp na potrzeby HackNation TEAM PANDA: to nie jest serwis mObywatel ani ZUS, żadne dane nie są wysyłane, a profile są zmyślone.</div>';
const MENU=[['bot','Asystent AI','asystent'],['pdf','Sprawa z PDF','sprawa'],['wnioski','Moje wnioski','wnioski'],['kal','Kalendarz','kalendarz'],['calc','Kalkulator','calc'],['dok','Dokumenty','dokumenty'],['zus','eZUS','ezus'],['akt','Odpis aktu urodzenia','akt']];
const NAV=[['home','Pulpit'],['form','Formularz'],['asystent','Asystent AI'],['sprawa','Sprawa z PDF'],['wnioski','Moje wnioski'],['kalendarz','Kalendarz'],['dokumenty','Dokumenty'],['ezus','eZUS'],['pomoc','Pomoc']];
const fresh=()=>({p:null,A:{},order:[],raw:{},auto:{},hint:'',tab:'wniosek',m:'chat',view:'profiles',sel:null,events:[],docs:{},sent:[],agent:[],akt:null,caseRes:null,zadlSplata:null,zadlZasw:[],akty:[],ezTab:'konto',ezMsg:[],ezOn:false});

function header(){
if($('#hlogo')&&!$('#hlogo').src)$('#hlogo').src=LOGO.match(/src="([^"]+)"/)[1];
const inApp=!!S.p&&S.view!=='login'&&S.view!=='profiles';
document.querySelector('#nav').style.display=inApp?'':'none';
$('#app').className='';
$('#nav').innerHTML=NAV.map(n=>`<span class="lnk${n[0]===S.view?' on':''}" data-nv="${n[0]}" tabindex="0">${n[1]}</span>`).join('');
document.querySelectorAll('#nav [data-nv]').forEach(x=>{const go=()=>{if(S.p){S.view=x.dataset.nv;render()}};x.onclick=go;x.onkeydown=e=>{if(e.key==='Enter')go()}});
if(!inApp){$('#who').innerHTML='';return}
$('#who').innerHTML=`<span class="chip">${esc(nm(S.p))}</span> <button class="btn sm" id="lo2">Wyloguj</button>`;
$('#lo2').onclick=()=>{S=fresh();render()};
}
function renderProfiles(){
$('#app').innerHTML=`<div class="wrap login">
<h2>Sprawdź, co Ci przysługuje</h2>
<p class="lead">Rozmowa ustali Twoją sytuację, wskaże wniosek, który trzeba złożyć, i zapisze dane potrzebne w kolejnych wnioskach. Dane o ubezpieczeniu pochodzą z NAJPRAWDZIWSZEGO ZUS, więc nie musisz ich wpisywać.</p>
<div class="mob"><div class="badge">${ico('lock',22)}</div><div style="flex:1;min-width:200px"><strong>Logowanie przez mObywatel</strong><div class="note">Wybierz profil testowy. Na następnym ekranie hasło będzie już wpisane.</div></div></div>
<div class="grid">${PERS.map(p=>`<div class="card"><div class="ch"><span class="av${p.risk?' r':''}">${esc(ini(p)||'?')}</span><div><h3>${esc(nm(p))}</h3><span class="tag${p.risk?' r':''}">${esc(p.tag)}</span></div></div><div class="meta">${esc(p.opis)}</div><div class="row"><button class="btn pri" data-pid="${p.id}">Zaloguj</button></div></div>`).join('')}</div>
${SIM}</div>`;
document.querySelectorAll('[data-pid]').forEach(b=>b.onclick=()=>{S.sel=b.dataset.pid;S.view='login';render()});
}
function renderPass(){
const p=PERS.find(x=>x.id===S.sel),z=p.zus;
const facts=p.manual?'<li>Brak danych w ZUS: wszystko podasz w rozmowie.</li>':`<li>Tytuł ubezpieczenia: <strong>${esc(FORMA[z.forma])}</strong></li>${z.forma!=='brak'?`<li>Płatnik: <strong>${esc(z.platnik)}</strong></li><li>Ubezpieczenie od: <strong>${fmt(z.od)}</strong></li>`:''}<li>Rachunek do wypłat: <strong>${esc(p.dane.konto)}</strong></li>`;
$('#app').innerHTML=`<div class="wrap"><button class="back" id="bk">${ico('back',18)} Wybierz inny profil</button>
<div class="lgrid"><section class="lside"><div class="ch"><span class="av big${p.risk?' r':''}">${esc(ini(p)||'?')}</span><div><h2>${esc(nm(p))}</h2><span class="tag${p.risk?' r':''}">${esc(p.tag)}</span></div></div><p class="lead">${esc(p.opis)}</p><h3 class="h">Po zalogowaniu pobierzemy z ZUS</h3><ul class="facts">${facts}</ul></section>
<form id="lf" class="lcard"><h2>Logowanie</h2><label for="pw">Hasło</label><div class="pwbox">${ico('lock',20)}<input type="password" id="pw" value="symulacja123" readonly aria-readonly="true"></div><p class="note">Hasło jest już wpisane. Naciśnij „Zaloguj”.</p><button class="btn y wide" type="submit">Zaloguj</button>${SIM}</form></div></div>`;
$('#bk').onclick=()=>{S.view='profiles';render()};
$('#lf').onsubmit=e=>{e.preventDefault();
 const ov=document.createElement('div');ov.className='overlay';ov.innerHTML='<div>Logowanie… pobieranie danych z ZUS</div>';document.body.appendChild(ov);
 setTimeout(()=>{ov.remove();S={...fresh(),p,view:'home'};render()},700)};
}
function renderHome(){
const p=S.p,z=p.zus,started=S.order.length>0;
const facts=p.manual?'<li>Brak danych w ZUS. Uzupełnisz je w formularzu.</li>':`<li><span>Tytuł ubezpieczenia</span><strong>${esc(FORMA[z.forma])}</strong></li>${z.forma!=='brak'?`<li><span>Płatnik</span><strong>${esc(z.platnik)}</strong></li><li><span>Od</span><strong>${fmt(z.od)}</strong></li>${z.forma==='jdg'?'':`<li><span>Umowa do</span><strong>${z.koniec?fmt(z.koniec):'bezterminowo'}</strong></li>`}`:''}`;
$('#app').innerHTML=`<div class="wrap"><h2 class="hi">Dzień dobry${p.manual?'':', '+esc(p.dane.imie)}</h2>
<div class="hgrid"><div class="start"><h2>${started?'Dokończ formularz':'Uzupełnij formularz'}</h2><p>Kilka pytań o Twoją sytuację. Wskażemy wniosek, który trzeba złożyć, policzymy zasiłek i zapamiętamy dane do kolejnych wniosków.</p><button class="btn light" id="go">${started?'Kontynuuj':'Zacznij'}</button></div>
<aside class="zcard"><h3>Twoje dane z ZUS</h3><ul class="facts kv2">${facts}</ul><p class="note">Coś się nie zgadza? Poprawisz to na początku formularza.</p></aside></div>
<h3 class="h menuh">Menu</h3><div class="menu">${MENU.map(m=>`<button class="mi" data-goto="${m[2]}">${ico(m[0])}<span>${m[1]}</span></button>`).join('')}</div>${SIM}</div>`;
$('#go').onclick=()=>{S.view='form';render()};
bindGoto();
}
