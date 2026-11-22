/* Silnik reguł i kalkulator zasiłków: compute() */
function compute(){
const c=ctx(),A=c.A,R={fired:new Set(),ben:[],risks:[],good:[],att:[],tl:[],blocked:null,w:null,info:[]};
const F=id=>R.fired.add(id);
if(!c.typ||!c.forma)return R;
const f=c.forma;
const preg=A.termin?addD(A.termin,-280):A.data_porodu?addD(A.data_porodu,-280):null;
if(f==='brak'&&c.typ==='mama'&&A.etap==='ciaza'&&(A.utrata===undefined||A.utrata==='upadlosc'||A.utrata==='wyrok')){
 if(A.utrata==='upadlosc'||A.utrata==='wyrok'){const br=(+A.utrata_brutto||0)*(1-CFG.skladki/100);F(A.utrata==='wyrok'?'R16':'R15');R.ben.push({n:'Zasiłek w wysokości zasiłku macierzyńskiego',od:null,do:A.termin||null,tyg:'do dnia porodu',pct:100,m:Math.max(br,CFG.minZas),r:A.utrata==='wyrok'?'R16':'R15'});R.att.push({t:A.utrata==='wyrok'?'Prawomocny wyrok sądu o bezprawnym rozwiązaniu umowy':'Dokument potwierdzający upadłość lub likwidację pracodawcy (do potwierdzenia, jaki)',r:A.utrata==='wyrok'?'R16':'R15'});R.w={name:'Wniosek o zasiłek w wysokości zasiłku macierzyńskiego',where:'Do ZUS',pay:'Zasiłek ustala i wypłaca ZUS.',when:'Za okres od rozwiązania umowy do dnia porodu. Po porodzie złóż wniosek o zasiłek macierzyński.'};R.info.push('Przysługuje, gdy w ciąży straciłaś pracę z powodu upadłości lub likwidacji pracodawcy i nie zapewniono Ci innej pracy, albo gdy umowę rozwiązano z naruszeniem przepisów (potwierdza to prawomocny wyrok).')}
 return R}
if(f==='brak'){F('R01');R.blocked='Bez ubezpieczenia chorobowego nie przysługuje ani zasiłek chorobowy w ciąży, ani zasiłek macierzyński. Prawo do zasiłku macierzyńskiego ma osoba ubezpieczona w dniu porodu lub przyjęcia dziecka.'}
else if((f==='zlecenie'||f==='jdg')&&!c.dobr){F('R04');R.blocked='Przy '+(f==='jdg'?'działalności':'zleceniu')+' zasiłki przysługują tylko wtedy, gdy opłacasz dobrowolne ubezpieczenie chorobowe. Bez niego nie dostaniesz zasiłku chorobowego ani macierzyńskiego. Zgłoszenie do ubezpieczenia możesz zrobić teraz; zasiłek chorobowy przysługuje po 90 dniach.'}
if(c.typ==='adop'&&!R.blocked){if(A.wiek!==undefined&&+A.wiek>=14){F('R34');R.blocked='Urlop na warunkach urlopu macierzyńskiego przy adopcji przysługuje, gdy dziecko ma mniej niż 14 lat.'}else if(A.sad===false){F('R34');R.blocked='Najpierw trzeba złożyć wniosek do sądu o przysposobienie. Od tego momentu (po przyjęciu dziecka) możesz ubiegać się o urlop i zasiłek.'}}
if(c.typ==='zast'&&!R.blocked){const lim=A.odroczenie===true?10:7;if(A.typ_zast==='zawodowa'){F('R35');R.blocked='Zasiłek za urlop na warunkach urlopu macierzyńskiego nie przysługuje zawodowej rodzinie zastępczej.'}else if(A.wiek!==undefined&&+A.wiek>=lim){F('R35');R.blocked=`Dla rodziny zastępczej niezawodowej urlop przysługuje, gdy dziecko ma mniej niż ${lim} lat.`}}
if(!R.blocked&&c.koniec&&c.birth&&diff(c.koniec,c.birth)>0){
 if(c.typ==='mama'&&f==='uop'&&preg&&diff(addD(preg,91),c.koniec)>0){F('R07');R.good.push({t:`Umowa na czas określony kończy się ${fmt(c.koniec)}, czyli po 3. miesiącu ciąży, więc z mocy prawa przedłuża się do dnia porodu. Dzięki temu w dniu porodu będziesz ubezpieczona.`,id:'R07'})}
 else{F('R01');R.risks.push({h:1,t:`Umowa kończy się ${fmt(c.koniec)}, przed ${A.termin?'terminem porodu':'porodem'}. Jeśli w dniu porodu nie będziesz ${c.g('ubezpieczona','ubezpieczony')}, zasiłek macierzyński nie przysługuje. Zadbaj o przedłużenie umowy lub inne ubezpieczenie.`,id:'R01'})}
}
if(!R.blocked&&c.typ==='mama'&&A.etap==='ciaza'&&(c.fx.includes('forma')||c.fx.includes('platnik'))){F('R01');R.risks.push({t:'Twoje dane różnią się od tych w ZUS (inna praca lub forma zatrudnienia). Nowy płatnik musi zgłosić Cię do ubezpieczenia; sprawdź na eZUS, czy zgłoszenie już jest, bo w dniu porodu musisz być ubezpieczona.',id:'R01'})}
if(!R.blocked&&A.zmiana==='zmiana'){F('R01');R.risks.push({t:'Zmiana pracy w ciąży: pilnuj, żeby nie było przerwy w ubezpieczeniu chorobowym w dniu porodu. Nowy pracodawca to też nowa podstawa zasiłku.',id:'R01'})}
if(!R.blocked&&A.zmiana==='konczy'&&!R.fired.has('R07')&&!(c.koniec&&c.birth&&diff(c.koniec,c.birth)>0)){F('R01');R.risks.push({h:1,t:'Jeśli umowa lub firma skończy się przed porodem, w dniu porodu możesz nie mieć ubezpieczenia i stracić prawo do zasiłku macierzyńskiego.',id:'R01'})}
if(!R.blocked&&c.typ==='mama'&&A.etap==='ciaza'&&c.od){const need=f==='uop'?CFG.karObow:CFG.karDobr,dn=diff(c.od,TODAY);if(dn<need){F(f==='uop'?'R02':'R03');R.risks.push({t:`Prawo do zasiłku chorobowego (L4) powstaje po ${need} dniach ubezpieczenia. Masz ich ${dn}, brakuje ${need-dn}. Do tego czasu L4 nie da zasiłku.`,id:f==='uop'?'R02':'R03'})}}
if(!R.blocked&&c.z.wzrost&&!c.man){F('R06');R.risks.push({h:1,t:'Podstawa Twoich składek wzrosła w czasie ciąży. ZUS może to zbadać i ustalić niższą podstawę zasiłku.',id:'R06'})}
if(!R.blocked&&c.typ==='mama'&&preg&&c.od&&diff(preg,c.od)>0){F('R06');R.risks.push({t:'Ubezpieczenie zaczęło się już w czasie ciąży. ZUS może sprawdzić, czy umowa nie została zawarta dla pozoru; w jednej ze spraw testowych skończyło się to odmową zasiłku.',id:'R06'})}
if(!R.blocked&&f==='jdg')F('R05');
if(!R.blocked&&f==='uop'&&c.typ==='mama'&&A.etap==='ciaza'){F('R08');R.good.push({t:'W ciąży i w czasie urlopów pracodawca nie może wypowiedzieć Ci umowy (poza wyjątkami z Kodeksu pracy).',id:'R08'})}
if(!R.blocked&&f!=='uop'&&c.typ==='mama'&&A.etap==='ciaza')R.risks.push({t:'Szczególna ochrona z Kodeksu pracy (zakaz zwolnienia, przedłużenie umowy do porodu) nie obejmuje zlecenia ani działalności.',id:'R08'});
if(R.blocked)return R;

const podst=c.brutto*(1-CFG.skladki/100);
const per=(pct,mac)=>{let v=podst*pct/100;if(mac&&v<CFG.minZas)v=CFG.minZas;return v};
const add=(o)=>R.ben.push(o);
const B=c.birth;
const pay=(f==='uop'||f==='zlecenie')?(c.ponad20?'Pracodawca sam ustali prawo do zasiłku i go wypłaci.':(c.ponad20===false?`Płatnik prześle do ZUS zaświadczenie ${f==='uop'?'Z-3':'Z-3a'}, a zasiłek wypłaci ZUS.`:'Jeśli płatnik zgłasza do 20 osób, prześle do ZUS zaświadczenie Z-3; jeśli więcej, wypłaci zasiłek sam.')):'Zasiłek ustala i wypłaca ZUS.';
if(f==='uop'||f==='zlecenie')F('R11');
const where=f==='uop'?'Do pracodawcy: '+c.platnik:f==='zlecenie'?'Do zleceniodawcy (płatnika) albo do ZUS':'Do ZUS, przez eZUS';
F(f==='uop'?'R19':'R20');
const formName=f==='uop'?null:'ZAM';
const w815=A.w815==='815';

if(c.typ==='mama'){
 if(A.etap==='ciaza'){F('R09');add({n:'Zasiłek chorobowy w ciąży (L4 z kodem B)',okr:'za okres zwolnienia, maks. 270 dni',pct:100,m:per(100),r:'R09'});
  if(f==='uop'){F('R10');R.info.push('Na L4 pierwsze 33 dni w roku płaci pracodawca jako wynagrodzenie chorobowe, potem zasiłek z ZUS.')}
  if(c.ezlaNow){R.info.push(`Masz aktualne zwolnienie e-ZLA (${fmt(c.ezlaNow.od)} – ${fmt(c.ezlaNow.do)}, kod ${c.ezlaNow.kod}).`)}
  if(c.ins){F('R13');R.info.push('Jeśli zasiłek chorobowy się wyczerpie (270 dni), a leczenie trwa, możliwe jest świadczenie rehabilitacyjne. Warunki do potwierdzenia w ZUS.')}
  if(f==='jdg'&&(A.l4===true||c.ezlaNow)){F('R12');R.att.push({t:'ZAS-53: wniosek o zasiłek chorobowy (za okres L4)',r:'R12'})}}
 if(A.spec==='poronienie'){R.info.push('Dokument konkursowy nie opisuje zasiłku po poronieniu. Skontaktuj się z ZUS lub płatnikiem, żeby ustalić swoje prawa. Poniżej organizacje wsparcia.');R.support=true}
 else if(c.spec&&B){
  R.support=true;
  if(A.spec==='martwe'||(A.data_zgonu&&diff(B,A.data_zgonu)<56)){F('R36');const end=maxD(addD(B,CFG.martweTyg*7),A.data_zgonu?addD(A.data_zgonu,7):B);add({n:'Zasiłek macierzyński',od:B,do:end,tyg:A.spec==='martwe'?CFG.martweTyg+' tyg.':'do '+fmt(end),pct:100,m:per(100,1),r:'R36'})}
  else if(A.data_zgonu){F('R37');add({n:'Zasiłek macierzyński (zachowany po śmierci dziecka)',od:B,do:addD(A.data_zgonu,7),tyg:'do 7 dni od zgonu',pct:100,m:per(100,1),r:'R37'})}
  R.att.push({t:A.spec==='martwe'?'Zaświadczenie o martwym urodzeniu':'Dokument potwierdzający zgon dziecka (do potwierdzenia, jaki)',r:'R36'});
  R.w={name:f==='uop'?'Wniosek o urlop macierzyński':'ZAM: wniosek o zasiłek macierzyński',where,pay,when:'Po porodzie, z dokumentami wymienionymi niżej.'};
 } else if(B){
  const macW=CFG.mac[c.n-1];F('R18');if(c.n>1)F('R26');
  const przed=A.etap==='ciaza'&&A.start_przed==='tak';if(przed)F('R17');
  const start=przed?maxD(addD(B,-CFG.przedTyg*7),TODAY):B;
  let mamaMacW=macW;
  if(A.drugi==='przej'){F('R30');mamaMacW=14}
  const endMac=addD(start,mamaMacW*7);
  add({n:'Urlop macierzyński',od:start,do:endMac,tyg:mamaMacW+' tyg.'+(A.drugi==='przej'?' (reszta: tata)':''),pct:w815?CFG.st815:CFG.stMac,m:per(w815?CFG.st815:CFG.stMac,1),r:'R18'});
  let next=endMac;
  if(c.hospAny){F('R22');add({n:'Uzupełniający urlop macierzyński',od:endMac,do:null,tyg:c.hospWcz?`do ${CFG.uzupA} albo ${CFG.uzupB} tyg.*`:`do ${CFG.uzupA} tyg.*`,pct:CFG.stMac,m:per(CFG.stMac,1),r:'R22'});R.info.push('* Długość urlopu uzupełniającego zależy m.in. od tygodnia ciąży i masy urodzeniowej oraz czasu pobytu w szpitalu. Liczby to parametry do potwierdzenia z załącznikiem ZUS.');R.att.push({t:'Zaświadczenie ze szpitala o hospitalizacji / wcześniactwie'+kidList(c,k=>k.hosp==='wczesniak'||k.hosp==='hosp'),r:'R22'})}
  F('R27');F('R23');if(c.zz)F('R25');
  const other=A.drugi==='rodz'?Math.max(CFG.nieprzen,+A.drugi_tyg||CFG.nieprzen):CFG.nieprzen;
  let rw=Math.max(0,c.pool-other);
  let ext=rw;
  if(A.laczenie&&A.laczenie!=='nie'){F('R29');ext=Math.round(rw/(1-(+A.laczenie)))}
  add({n:'Urlop rodzicielski',od:next,do:!c.hospAny?addD(next,ext*7):null,tyg:ext+' tyg.'+(ext!==rw?` (${rw} tyg. przy pracy na ${A.laczenie==='0.5'?'pół':'ćwierć'} etatu)`:''),pct:w815?CFG.st815:CFG.stRodz,m:per(w815?CFG.st815:CFG.stRodz,1)*(ext!==rw?(1-(+A.laczenie)):1),r:'R23'});
  const pod2=(+A.drugi_brutto||0)*(1-CFG.skladki/100),m2=pct=>pod2>0?Math.max(pod2*pct/100,CFG.minZas):null;
  if(A.drugi==='rodz')add({n:'Rodzicielski: drugi rodzic',od:null,do:null,tyg:other+' tyg.',pct:CFG.stRodz,m:m2(CFG.stRodz),r:'R27',note:pod2>0?'od podanego wynagrodzenia drugiego rodzica':'liczone od jego podstawy'});
  if(A.drugi==='przej')add({n:'Macierzyński przejęty przez tatę',od:endMac,do:addD(endMac,(macW-14)*7),tyg:(macW-14)+' tyg.',pct:CFG.stMac,m:m2(CFG.stMac),r:'R30',note:pod2>0?'od podanego wynagrodzenia drugiego rodzica':'liczone od jego podstawy'});
  if(A.drugi==='nie'||A.drugi==='niewiem')R.info.push(`${CFG.nieprzen} tyg. rodzicielskiego jest zarezerwowane dla drugiego rodzica. Jeśli z nich nie skorzysta, przepadają.`);
  if(A.w815==='niewiem'){const wk=m=>m/4.345;R.cmp={macW:mamaMacW,rodzW:rw,a:{mac:per(CFG.stMac,1),rodz:per(CFG.stRodz,1)},b:{mac:per(CFG.st815,1),rodz:per(CFG.st815,1)},termin:B?addD(B,CFG.okno815):null};R.cmp.a.tot=wk(R.cmp.a.mac)*mamaMacW+wk(R.cmp.a.rodz)*rw;R.cmp.b.tot=wk(R.cmp.b.mac)*mamaMacW+wk(R.cmp.b.rodz)*rw;}
  if(w815){F('R24');R.att.push({t:`Pisemny wniosek o zasiłek w wysokości ${pc(CFG.st815)}% (do ${CFG.okno815} dni po porodzie)`,r:'R24'})}
  if(przed)R.att.push({t:'Zaświadczenie lekarskie o przewidywanej dacie porodu',r:'R17'});
  R.w={name:f==='uop'?'Wniosek o urlop macierzyński i rodzicielski':'ZAM: zasiłek macierzyński za urlop macierzyński i rodzicielski',where,pay,when:przed?(start===TODAY?'Przed rozpoczęciem urlopu, czyli możesz złożyć od razu, z zaświadczeniem lekarskim o terminie porodu.':`Przed rozpoczęciem urlopu (najwcześniej ${fmt(start)}), z zaświadczeniem o terminie porodu.`):'Po porodzie, z odpisem aktu urodzenia. Jeden wniosek może objąć oba urlopy.'};
 }
}
if(c.typ==='tata'&&B){
 F('R33');
 if(A.etap==='po'||A.etap==='ciaza'){add({n:'Urlop ojcowski',od:null,do:null,tyg:CFG.ojcDni+' dni (całość lub 2 × 7)',pct:CFG.stMac,m:per(CFG.stMac,1),r:'R33',note:'do '+fmt(addM(B,12))})}
 if(A.mama_status&&A.mama_status!=='tak'){F('R31');const macW=CFG.mac[c.n-1];add({n:'Urlop macierzyński przejęty od mamy',od:B,do:null,tyg:A.mama_status==='szpital'?'na czas pobytu mamy w szpitalu':'pozostała część z '+macW+' tyg.',pct:CFG.stMac,m:per(CFG.stMac,1),r:'R31'});R.att.push({t:{szpital:'Zaświadczenie o pobycie mamy w szpitalu',orzeczenie:'Orzeczenie o niezdolności mamy do samodzielnej egzystencji',smierc:'Akt zgonu mamy dziecka',porzucenie:'Dokument potwierdzający porzucenie dziecka'}[A.mama_status]+' (do potwierdzenia)',r:'R31'})}
 if(A.mama_ubezp==='nie'){F('R32');R.info.push('Mama nie była ubezpieczona w dniu porodu, więc możesz skorzystać z urlopu rodzicielskiego mimo to.')}
 if(c.hospAny){F('R22');R.info.push('Uzupełniający urlop macierzyński przysługuje mamie albo tacie (tylko jednemu z rodziców).')}
 if(+A.tata_tyg>0){F('R27');add({n:'Urlop rodzicielski',od:null,do:null,tyg:A.tata_tyg+' tyg.',pct:CFG.stRodz,m:per(CFG.stRodz,1),r:'R27'})}
 else R.info.push(`Nie bierzesz rodzicielskiego: Twoje ${CFG.nieprzen} tyg. przepadną.`);
 if(A.laczenie&&A.laczenie!=='nie')F('R29');
 R.w={name:f==='uop'?'Wniosek o urlop ojcowski'+(+A.tata_tyg>0?' i rodzicielski':''):'ZAM: zasiłek za urlop ojcowski'+(+A.tata_tyg>0?' i rodzicielski':''),where,pay,when:A.etap==='ciaza'?'Po porodzie, z odpisem aktu urodzenia.':`Urlop ojcowski wykorzystaj do ${fmt(addM(B,12))}.`};
}
if((c.typ==='adop'||c.typ==='zast')&&A.przyjecie){
 F(c.typ==='adop'?'R34':'R35');
 add({n:'Urlop na warunkach urlopu macierzyńskiego',od:A.przyjecie,do:addD(A.przyjecie,CFG.mac[0]*7),tyg:CFG.mac[0]+' tyg.*',pct:CFG.stMac,m:per(CFG.stMac,1),r:c.typ==='adop'?'R34':'R35'});
 R.info.push('* Wymiar urlopu przy przyjęciu dziecka zależy też od jego wieku. Liczba to parametr do potwierdzenia z załącznikiem ZUS.');
 const mine=c.k?(A.drugi==='rodz'?Math.max(0,c.pool-Math.max(CFG.nieprzen,+A.drugi_tyg||9)):c.pool-CFG.nieprzen):(+A.tata_tyg||0);
 if(mine>0){F('R27');let ext=mine;if(A.laczenie&&A.laczenie!=='nie'){F('R29');ext=Math.round(mine/(1-(+A.laczenie)))}add({n:'Urlop rodzicielski',od:addD(A.przyjecie,CFG.mac[0]*7),do:null,tyg:ext+' tyg.'+(ext!==mine?` (${mine} tyg. przy pracy na część etatu)`:''),pct:CFG.stRodz,m:per(CFG.stRodz,1)*(ext!==mine?(1-(+A.laczenie)):1),r:'R27'})}
 if(c.typ==='adop'&&!c.k){F('R33');add({n:'Urlop ojcowski',od:null,do:null,tyg:CFG.ojcDni+' dni',pct:CFG.stMac,m:per(CFG.stMac,1),r:'R33',note:'12 mies. od uprawomocnienia przysposobienia, max do 14. urodzin'})}
 R.att.push({t:c.typ==='adop'?'Potwierdzenie złożenia wniosku do sądu o przysposobienie (do potwierdzenia)':'Postanowienie o umieszczeniu dziecka w rodzinie zastępczej (do potwierdzenia)',r:c.typ==='adop'?'R34':'R35'});
 R.w={name:f==='uop'?'Wniosek o urlop na warunkach urlopu macierzyńskiego':'ZAM: zasiłek za urlop na warunkach urlopu macierzyńskiego',where,pay,when:'Po przyjęciu dziecka na wychowanie.'};
}
if(parent(c)&&B&&!A.spec)  {F('R21');R.att.unshift({t:c.n>1?`Odpisy aktów urodzenia dzieci (${c.n} szt.: ${c.kids.map(kidName).join(', ')})`:'Odpis aktu urodzenia dziecka',r:'R21'})}
if(c.zz)R.att.push({t:'Zaświadczenie „Za życiem”'+kidList(c,k=>k.zazycie==='tak'),r:'R25'});

const tl=R.tl,P=(d,t,x,w)=>d&&tl.push({d,t,x,w});
if(c.typ==='mama'&&A.etap==='ciaza'&&A.termin&&!c.spec){P(maxD(addD(A.termin,-CFG.przedTyg*7),TODAY),soon(A.termin)?'Urlop macierzyński możesz zacząć od dziś':'Najwcześniejszy start urlopu macierzyńskiego','Potrzebne zaświadczenie lekarskie o terminie.',A.start_przed==='tak');P(A.termin,'Przewidywany termin porodu','')}
if(parent(c)&&B&&!c.spec){
 P(addD(B,7),'Zgłoszenie dziecka do ubezpieczenia zdrowotnego (ZUS ZCNA)','Poza zakresem konkursu, ale łatwo o tym zapomnieć.',1);
 if(c.typ==='mama'){P(addD(B,CFG.okno815),`Ostatni dzień na wniosek o ${pc(CFG.st815)}%`,'',A.w815==='815');const mb=R.ben.find(b=>b.n==='Urlop macierzyński');if(mb){P(addD(mb.do,-14),'Złóż wniosek o urlop rodzicielski','Wniosek jest już prawie wypełniony danymi z profilu.',1);P(mb.do,'Koniec urlopu macierzyńskiego','')}if(A.drugi==='przej')P(addD(B,14*7),'Najwcześniejsze przejęcie urlopu przez tatę','Rezygnacja mamy + wniosek taty.',1)}
 if(c.typ==='tata')P(addM(B,12),'Ostatni dzień na urlop ojcowski','Po tym terminie prawo wygasa.',1);
 P((D(B).getFullYear()+6)+'-12-31','Ostatni dzień na urlop rodzicielski','Koniec roku, w którym dziecko kończy 6 lat.',0);
}
if((c.typ==='adop'||c.typ==='zast')&&A.przyjecie){P(A.przyjecie,'Przyjęcie dziecka','',0);P(addD(A.przyjecie,CFG.mac[0]*7-14),'Złóż wniosek o urlop rodzicielski','',1)}
if(f==='jdg'){R.dniPrawa=dniPrawa(c,R);
 if(!c.man){const st=R.dniPrawa.map(p=>({...p,s:debtOn(c,p.d)}));const bad=st.filter(p=>p.s&&p.s.ponad);
  if(bad.length&&S.zadlSplata)R.risks.push({t:bad.map(p=>`Na dzień powstania prawa do świadczenia „${p.n}” (${fmt(p.d)}) zadłużenie w składkach wynosiło ${zlTxt(p.s.razem)}.`).join(' ')+` Zadłużenie opłacone ${fmt(S.zadlSplata)}. Prawo do zasiłku zachowasz, jeśli spłata nastąpiła w ciągu ${CFG.dniSplaty} dni od wezwania ZUS.`,id:'R05'});
  else if(bad.length)R.risks.push({h:1,t:bad.map(p=>`Na dzień powstania prawa do świadczenia „${p.n}” (${fmt(p.d)}) zadłużenie w składkach wyniesie ${zlTxt(p.s.razem)}${p.s.ods?` (w tym odsetki ${zlTxt(p.s.ods)})`:''}.`).join(' ')+` ZUS wezwie Cię do spłaty; ureguluj ją w ciągu ${CFG.dniSplaty} dni od wezwania, a najlepiej wcześniej, żeby nie stracić prawa do zasiłku. Szczegóły i zaświadczenie: sekcja „Zadłużenie w składkach”.`,id:'R05'});
  else if(st.length)R.good.push({t:'Brak zadłużenia w składkach na dzień powstania prawa do zasiłku'+(st.some(p=>p.s.razem>0)?' powyżej progu':'')+'.',id:'R05'});
  if(st.length)R.att.push({t:'Zaświadczenie o stanie zadłużenia w składkach na dzień powstania prawa ',r:'R05'})}}
tl.sort((a,b)=>diff(b.d,a.d));
return R;
}
