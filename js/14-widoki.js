/* Widoki: kalendarz, dokumenty, moje wnioski, pomoc */
/* ---------- kalendarz ---------- */
function renderKalendarz(){
const R=compute(),c=ctx();
const ev=[...R.tl.map(e=>({...e,src:'auto'})),...S.events.map((e,i)=>({d:e.d,t:e.t,x:'Dodane przez Ciebie',w:1,src:'own',i}))].sort((a,b)=>diff(b.d,a.d));
const hint=c.typ==='mama'&&S.A.etap==='ciaza'?'<p class="note">Wpisz np. wizytę u lekarza: lekarz oceni, czy możesz dalej pracować, i wystawi zaświadczenie o terminie porodu, jeśli chcesz zacząć urlop wcześniej.</p>':'';
$('#app').innerHTML=page('Kalendarz',`<div class="cols"><div>${ev.length?`<ul class="tl">${ev.map(e=>`<li class="${diff(e.d,TODAY)>0?'past':''}${e.w?' w':''}"><span class="d">${fmt(e.d)}</span>${esc(e.t)}${e.x?`<div class="x">${esc(e.x)}</div>`:''}${e.src==='own'?` <button class="btn sm" data-del="${e.i}">Usuń</button>`:''}</li>`).join('')}</ul>`:needForm()}</div>
<form class="zcard" id="evf"><h3>Dodaj wydarzenie</h3>${hint}<label for="evd">Data</label><input type="date" id="evd" min="${addD(TODAY,-30)}"><label for="evt">Co to jest</label><input type="text" id="evt" value="${c.typ==='mama'&&S.A.etap==='ciaza'?'Wizyta u lekarza':''}"><div class="err" id="ever"></div><button class="btn pri" type="submit">Dodaj</button></form></div>`);
$('#evf').onsubmit=e=>{e.preventDefault();const d=$('#evd').value,t=$('#evt').value.trim();if(!d||!t){$('#ever').textContent='Podaj datę i opis.';return}S.events.push({d,t});renderKalendarz()};
document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{S.events.splice(+b.dataset.del,1);renderKalendarz()});
bindGoto();
}
/* ---------- dokumenty ---------- */
function renderDokumenty(){
const R=compute(),c=ctx(),ez=c.ezla;
const att=R.att;
$('#app').innerHTML=page('Dokumenty',`<div class="cols"><div><h3 class="h" style="margin-top:0">Do przygotowania</h3>${att.length?`<ul class="list">${att.map(a=>`<li><label class="chk"><input type="checkbox" data-doc="${esc(a.t)}"${S.docs[a.t]?' checked':''}> ${esc(a.t)}</label> <span class="rid">${a.r}</span></li>`).join('')}</ul><p class="note">Zaznaczaj dokumenty, które już masz.</p>`:formDone()?'<div class="empty">Na tym etapie nie potrzebujesz dodatkowych dokumentów.</div>':needForm()}
${zadlHTML(R)}${R.w?`<h3 class="h">Twój wniosek</h3><ul class="list"><li><strong>${esc(R.w.name)}</strong><br>${esc(R.w.where)}<br><span class="note">${esc(R.w.when)}</span>${formDone()?`<div class="acts">${dlButtons()}</div>`:''}</li></ul>`:''}</div>
<aside class="zcard"><h3>Zwolnienia lekarskie e-ZLA </h3>${ez.length?`<ul class="facts kv2">${ez.map(e=>`<li><span>${fmt(e.od)} – ${fmt(e.do)}${e.status==='anulowane'?' (anulowane)':''}</span><strong>${e.kod?'kod '+esc(e.kod):'bez kodu'}</strong></li>`).join('')}</ul><p class="note">Kod B oznacza zwolnienie w ciąży: zasiłek 100%.</p>`:'<p class="note">Brak zwolnień w symulowanych danych.</p>'}<button class="btn sm" data-ezgo="ezla">Szczegóły w eZUS</button><h3 style="margin-top:16px">Wzory formularzy</h3><p class="note">Aktualne wzory ZAM, ZAS-53 i innych są na zus.pl w dziale „Wzory formularzy”.</p><a href="https://www.zus.pl" target="_blank" rel="noopener">zus.pl</a></aside></div>`);
document.querySelectorAll('[data-doc]').forEach(i=>i.onchange=()=>{S.docs[i.dataset.doc]=i.checked});
document.querySelectorAll('[data-ezgo]').forEach(b=>b.onclick=()=>{S.ezTab=b.dataset.ezgo;S.view='ezus';render()});
bindZadl(R);
bindDl();
bindGoto();
}
/* ---------- moje wnioski ---------- */
function renderWnioski(){
const R=compute();
$('#app').innerHTML=page('Moje wnioski',`${R.w&&formDone()?`<div class="hero okb"><h3>${esc(R.w.name)}</h3><div class="where">${esc(R.w.where)}</div><div class="kv"><span>Szkic gotowy</span><span>${esc(R.w.when)}</span></div><div class="acts"><button class="btn pri" data-goto="form">Otwórz wniosek</button>${dlButtons()}</div></div>`:needForm()}
<h3 class="h">Wysłane</h3>${S.sent.length?`<table class="stack"><thead><tr><th>Wniosek</th><th>Adresat</th><th>Data</th><th>Numer</th><th>Status</th></tr></thead><tbody>${S.sent.map(s=>`<tr><td data-l="Wniosek">${esc(s.name)}</td><td data-l="Adresat">${esc(s.where)}</td><td data-l="Data" class="nw">${fmt(s.d)}</td><td data-l="Numer" class="nw">${esc(s.ref)}</td><td data-l="Status">Przyjęty do rozpatrzenia</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Nic jeszcze nie wysłano. Wniosek wyślesz z zakładki „Wniosek” w formularzu.</div>'}
${S.akty.length?`<h3 class="h">Wnioski o odpis aktu stanu cywilnego</h3>${aktyHTML()}<div class="acts"><button class="btn sm" id="akref">Odśwież status</button><button class="btn sm" data-goto="akt">Zamów kolejny odpis</button></div>`:''}${S.ezMsg.length?`<h3 class="h">Wiadomości do ZUS</h3><ul class="list">${S.ezMsg.map(m=>`<li><strong>${esc(m.nr)}</strong>: ${esc(m.temat)}, ${fmt(m.d)}<br><span class="note">${m.odp?'odpowiedź w eZUS':'oczekuje na odpowiedź'}</span></li>`).join('')}</ul>`:''}`);
if($('#akref'))$('#akref').onclick=()=>{aktyNext();renderWnioski()};
bindGoto();bindDl();
}
/* ---------- pomoc ---------- */
function renderPomoc(){
$('#app').innerHTML=page('Pomoc',`<div class="cols"><div><h3 class="h" style="margin-top:0">Organizacje wspierające rodziców</h3><p class="note">W sytuacjach szczególnych: przedwczesny poród, ciężka choroba dziecka, poronienie lub śmierć dziecka.</p>${supportHTML(null)}</div>
<aside><div class="zcard"><h3>Masz pytanie?</h3><p>Asystent AI zna Twoją sytuację z formularza i może policzyć warianty, np. inny podział urlopu.</p><button class="btn pri" data-goto="asystent">Zapytaj asystenta</button></div><h3 class="h">Przydatne strony</h3>${linksHTML()}</aside></div>`);
bindGoto();
}
