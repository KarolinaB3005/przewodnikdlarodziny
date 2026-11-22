/* Stan aplikacji, kontekst sprawy, pytania formularza (w tym osobno dla każdego dziecka) */
let S={p:null,A:{},order:[],raw:{},auto:{},hint:'',tab:'wniosek',m:'chat',view:'profiles',sel:null,events:[],docs:{},sent:[],agent:[],akt:null,caseRes:null};

function ctx(){
const p=S.p,z=p.zus,A=S.A,man=!!p.manual;
const fx=A.zus_fix||[];
const r=A.rola||'';
const typ=r==='mama'?'mama':r==='tata'?'tata':r.startsWith('adop')?'adop':r.startsWith('zast')?'zast':null;
const k=r==='mama'||r.endsWith('_k');
const has=(o,v)=>Object.prototype.hasOwnProperty.call(o,v);
const forma=has(A,'forma_m')?A.forma_m:(man?undefined:z.forma);
const birth=A.data_porodu||A.termin||null;
const n=Math.min(5,Math.max(1,+A.liczba||1));
const spec=(A.spec==='martwe'||A.spec==='zgon')?A.spec:null;
const ezla=man?[]:(p.ezla||[]);
return {p,z,A,man,fx,typ,k,forma,ezla,ezlaNow:ezla.find(e=>diff(e.od,TODAY)>=0&&diff(TODAY,e.do)>=0)||null,
 ch:key=>man||fx.includes(key),
 platnik:A.platnik_m||(man||fx.includes('platnik')||fx.includes('forma')?(forma==='uop'?'Twój pracodawca':'Twój zleceniodawca'):z.platnik),
 od:has(A,'od_m')?A.od_m:(man?null:z.od),
 koniec:A.koniec_m==='bezterminowa'?null:A.koniec_m==='data'?(A.koniec_d||null):(man||fx.includes('forma')||fx.includes('platnik')?null:z.koniec),
 dobr:has(A,'dobr_m')?A.dobr_m===true:(man?false:z.dobr),
 ponad20:has(A,'ponad20_m')?(A.ponad20_m==='tak'?true:A.ponad20_m==='nie'?false:null):(man||fx.includes('platnik')||fx.includes('forma')?null:z.ponad20),
 brutto:has(A,'brutto_m')?(+A.brutto_m||0):(man?0:z.brutto),birth,n,spec,ins:!!forma&&forma!=='brak',
 dniOdPorodu:A.data_porodu?diff(A.data_porodu,TODAY):null,
 kids:kidsOf(A,n),
 hospAny:kidsOf(A,n).some(k=>k.hosp==='wczesniak'||k.hosp==='hosp'),
 hospWcz:kidsOf(A,n).some(k=>k.hosp==='wczesniak'),
 zz:kidsOf(A,n).some(k=>k.zazycie==='tak'),
 pool:(kidsOf(A,n).some(k=>k.zazycie==='tak')?(n>1?CFG.zz2:CFG.zz1):(n>1?CFG.rodz2:CFG.rodz1)),
 g:(f,m)=>k?f:m};
}
const parent=c=>c.typ==='mama'||c.typ==='tata';
/* pytania zadawane osobno dla każdego dziecka (bliźnięta, wieloraczki); dziecko 1 zachowuje identyfikatory hosp/imie/zazycie */
const KID_BASE=[
{id:'hosp',when:c=>parent(c)&&c.A.etap==='po'&&!c.spec,t:c=>'Czy dziecko jest lub było w szpitalu po porodzie?',type:'choice',o:c=>[['nie','Nie'],['wczesniak','Tak, to wcześniak'],['hosp','Tak, urodziło się o czasie, ale wymaga hospitalizacji']]},
{id:'imie',when:c=>parent(c)&&c.A.etap==='po'&&!c.spec,t:c=>'Jak ma na imię dziecko? To trafi do wniosku; możesz pominąć.',type:'text',opt:true},
{id:'zazycie',when:c=>parent(c)&&!c.spec,t:c=>'Czy dziecko ma (albo może dostać) zaświadczenie „Za życiem”? Wydaje je lekarz przy ciężkiej chorobie powstałej przed porodem lub w jego trakcie.',type:'choice',o:c=>[['nie','Nie'],['tak','Tak'],['niewiem','Nie wiem']]}
];
const KID_ORD=['','Pierwsze dziecko','Drugie dziecko','Trzecie dziecko','Czwarte dziecko','Piąte dziecko'];
const kidId=(base,i)=>i===1?base:base+'_'+i;
const KIDQ=[1,2,3,4,5].flatMap(i=>KID_BASE.map(b=>({...b,id:kidId(b.id,i),base:b.id,kid:i,when:c=>c.n>=i&&b.when(c),
 t:c=>{const t=b.t(c);if(c.n<2)return t;const nm=i>1&&b.id!=='imie'?c.A[kidId('imie',i)]:i===1&&b.id!=='imie'?c.A.imie:'';return `${KID_ORD[i]}${nm?' ('+nm+')':''}: ${t.charAt(0).toLowerCase()}${t.slice(1)}`}})));
/* dane o dzieciach (tylko tyle, ile wskazano w pytaniu o liczbę dzieci) */
const kidsOf=(A,n)=>Array.from({length:n},(_,j)=>{const i=j+1;return {i,imie:A[kidId('imie',i)]||'',hosp:A[kidId('hosp',i)],zazycie:A[kidId('zazycie',i)]}});
const KID_HOSP={nie:'nie',wczesniak:'tak, wcześniak',hosp:'tak, hospitalizacja'},KID_ZZ={nie:'nie',tak:'tak',niewiem:'nie wiadomo'};
const kidName=k=>k.imie?k.imie:'dziecko '+k.i;
/* przy kilkorgu dzieciach dopisuje, których dzieci dotyczy dokument / oświadczenie */
const kidList=(c,pred)=>c.n>1?' (dotyczy: '+c.kids.filter(pred).map(kidName).join(', ')+')':'';

const Q=[
{id:'rola',when:c=>true,t:c=>`Dzień dobry${c.p.dane.imie&&!c.p.manual?', '+c.p.dane.imie:''}. Pomogę ustalić, jaki wniosek będzie Ci potrzebny i co Ci przysługuje. Kim jesteś dla dziecka?`,type:'choice',o:c=>[['mama','Mama'],['tata','Tata'],['adop_k','Mama adopcyjna'],['adop_m','Tata adopcyjny'],['zast_k','Rodzina zastępcza, mama'],['zast_m','Rodzina zastępcza, tata']]},
{id:'zus_ok',when:c=>!c.p.manual,t:c=>c.z.forma==='brak'?'Dane z ZUS: nie widzę aktualnego tytułu do ubezpieczenia chorobowego. Zgadza się?':`Dane z ZUS : ${FORMA[c.z.forma]}, ${c.z.platnik}, od ${fmt(c.z.od)}${c.z.koniec?', umowa do '+fmt(c.z.koniec):''}${c.z.forma!=='uop'?', dobrowolne chorobowe: '+(c.z.dobr?'tak':'nie'):''}. Zgadza się?`,type:'yesno'},
{id:'zus_fix',when:c=>!c.man&&c.A.zus_ok===false,t:c=>'Co się zmieniło albo nie zgadza? Zaznacz pola albo opisz to własnymi słowami, np. „od września pracuję na zleceniu w innej firmie”.',type:'multi',o:c=>[['forma','Forma zatrudnienia'],['platnik','Pracodawca / zleceniodawca'],['od','Data rozpoczęcia'],['koniec','Data końca umowy'],['dobr','Dobrowolne chorobowe'],['brutto','Wynagrodzenie']]},
{id:'forma_m',when:c=>c.ch('forma'),t:c=>c.man?'Na jakiej podstawie pracujesz?':`W ZUS widnieje: ${FORMA[c.z.forma]}. Na jakiej podstawie pracujesz teraz?`,type:'choice',o:c=>[['uop','Umowa o pracę'],['zlecenie','Umowa zlecenie'],['jdg','Własna działalność'],['brak','Nie pracuję / brak ubezpieczenia']]},
{id:'platnik_m',when:c=>(c.ch('platnik')||c.ch('forma'))&&(c.forma==='uop'||c.forma==='zlecenie'),t:c=>c.forma==='uop'?'Jak nazywa się Twój pracodawca?':'Jak nazywa się zleceniodawca?',type:'text',opt:true},
{id:'ponad20_m',when:c=>(c.ch('platnik')||c.ch('forma'))&&(c.forma==='uop'||c.forma==='zlecenie'),t:c=>'Czy ta firma zgłasza do ubezpieczeń więcej niż 20 osób? Od tego zależy, kto wypłaci zasiłek.',type:'choice',o:c=>[['tak','Tak, więcej niż 20'],['nie','Nie, 20 lub mniej'],['niewiem','Nie wiem']]},
{id:'od_m',when:c=>c.ins&&(c.ch('od')||c.ch('forma')||c.ch('platnik')),t:c=>`Od kiedy jesteś ${c.g('ubezpieczona','ubezpieczony')} z tego tytułu?`,type:'date',max:0},
{id:'koniec_m',when:c=>(c.forma==='uop'||c.forma==='zlecenie')&&(c.ch('koniec')||c.ch('forma')||c.ch('platnik')),t:c=>'Czy umowa jest na czas nieokreślony, czy ma datę końca?',type:'choice',o:c=>[['bezterminowa','Na czas nieokreślony'],['data','Ma datę końca']]},
{id:'koniec_d',when:c=>c.A.koniec_m==='data'&&(c.forma==='uop'||c.forma==='zlecenie'),t:c=>'Do kiedy trwa umowa?',type:'date',min:-60,max:3650},
{id:'dobr_m',when:c=>(c.forma==='zlecenie'||c.forma==='jdg')&&(c.ch('dobr')||c.ch('forma')),t:c=>'Czy opłacasz dobrowolne ubezpieczenie chorobowe?',type:'yesno'},
{id:'brutto_m',when:c=>c.ins&&(c.ch('brutto')||c.ch('forma')||c.ch('platnik')),t:c=>c.forma==='jdg'?'Jaka jest Twoja miesięczna podstawa składek? (do kalkulatora)':'Ile średnio zarabiasz miesięcznie brutto? (do kalkulatora)',type:'number',min:0,max:100000,def:c=>c.z.brutto||5000,unit:'zł',after:(c,v)=>c.man?'':'Zapisuję. W ZUS mogą być jeszcze stare dane; wnioski wypełnię aktualnymi, które podajesz.'},
{id:'etap',when:c=>c.typ,t:c=>parent(c)?'Na jakim jesteście etapie?':'Na jakim jesteś etapie?',type:'choice',o:c=>parent(c)?[['ciaza',c.typ==='tata'?'Partnerka jest w ciąży':'Jestem w ciąży'],['po','Dziecko już jest']]:[['plan','Dopiero przyjmę dziecko'],['po','Dziecko jest już u nas']]},
{id:'termin',when:c=>parent(c)&&c.A.etap==='ciaza',t:c=>'Jaki jest przewidywany termin porodu?',type:'date',min:0,max:294,after:(c,v)=>c.typ!=='mama'?'Zapisuję termin porodu.':soon(v)?`Zapisuję. Do porodu zostało ${diff(TODAY,v)} dni, czyli mniej niż ${CFG.przedTyg} tygodni, więc urlop macierzyński możesz zacząć od razu.`:`Zapisuję. Termin porodu przyda się w kilku kolejnych wnioskach. Urlop macierzyński możesz zacząć najwcześniej ${fmt(addD(v,-CFG.przedTyg*7))}.`},
{id:'utrata',when:c=>c.typ==='mama'&&c.A.etap==='ciaza'&&c.forma==='brak',t:c=>'W ZUS nie widzę teraz ubezpieczenia. Czy straciłaś pracę w czasie ciąży?',type:'choice',o:c=>[['nie','Nie'],['upadlosc','Tak, przez upadłość lub likwidację pracodawcy'],['wyrok','Tak, umowę rozwiązano bezprawnie (mam wyrok sądu)']]},
{id:'utrata_brutto',when:c=>c.A.utrata==='upadlosc'||c.A.utrata==='wyrok',t:c=>'Ile średnio zarabiałaś brutto w ostatniej pracy? (do kalkulatora)',type:'number',min:0,max:100000,def:5000,unit:'zł'},
{id:'data_porodu',when:c=>parent(c)&&c.A.etap==='po',t:c=>'Kiedy urodziło się dziecko?',type:'date',min:-2200,max:0},
{id:'przyjecie',when:c=>c.typ==='adop'||c.typ==='zast',t:c=>c.A.etap==='plan'?'Kiedy planowo przyjmiesz dziecko?':'Kiedy przyjęłaś/przyjąłeś dziecko?',type:'date',min:-400,max:400},
{id:'wiek',when:c=>c.typ==='adop'||c.typ==='zast',t:c=>'Ile lat ma dziecko?',type:'number',min:0,max:17,def:2,unit:'lat'},
{id:'sad',when:c=>c.typ==='adop',t:c=>'Czy złożono już wniosek do sądu o przysposobienie?',type:'yesno'},
{id:'typ_zast',when:c=>c.typ==='zast',t:c=>'Jesteście rodziną zastępczą zawodową czy niezawodową?',type:'choice',o:c=>[['niezawodowa','Niezawodową'],['zawodowa','Zawodową']]},
{id:'odroczenie',when:c=>c.typ==='zast'&&+c.A.wiek>=7&&+c.A.wiek<10,t:c=>'Czy dziecko ma odroczony obowiązek szkolny?',type:'yesno'},
{id:'zmiana',when:c=>parent(c)&&c.A.etap==='ciaza'&&c.ins,t:c=>`Czy do porodu planujesz zmianę pracy albo czy Twoja umowa${c.forma==='jdg'?' lub firma':''} może się zakończyć?${c.koniec?(c.A.koniec_d?' Podana data końca umowy: ':' W ZUS widzę datę końca umowy: ')+fmt(c.koniec)+'.':''}`,type:'choice',o:c=>[['nie','Nie, wszystko zostaje'],['konczy',c.forma==='jdg'?'Firma może zostać zamknięta':'Umowa się kończy'],['zmiana','Zmieniam pracę']]},
{id:'l4',when:c=>c.typ==='mama'&&c.A.etap==='ciaza'&&c.ins&&!c.ezlaNow,t:c=>'Czy jesteś teraz na zwolnieniu lekarskim (L4)? W symulowanych danych nie widzę e-ZLA.',type:'yesno'},
{id:'start_przed',when:c=>c.typ==='mama'&&c.A.etap==='ciaza'&&c.ins,t:c=>soon(c.A.termin)?`Do porodu zostało ${diff(TODAY,c.A.termin)} dni. Chcesz zacząć urlop macierzyński już teraz, przed porodem?`:`Chcesz zacząć urlop macierzyński przed porodem? Najwcześniej od ${fmt(addD(c.A.termin,-CFG.przedTyg*7))}.`,type:'choice',o:c=>[['tak',soon(c.A.termin)?'Tak, od razu':'Tak'],['nie','Nie, od porodu'],['niewiem','Jeszcze nie wiem']]},
{id:'liczba',when:c=>parent(c),t:c=>c.A.etap==='ciaza'?'Ilu dzieci się spodziewacie?':'Ile dzieci urodziło się przy tym porodzie?',type:'choice',o:c=>c.A.etap==='ciaza'
 ?[['1','Jednego'],['2','Dwóch'],['3','Trzech'],['4','Czterech'],['5','Pięciu lub więcej']] // „spodziewacie się” + dopełniacz
 :[['1','Jedno'],['2','Dwoje'],['3','Troje'],['4','Czworo'],['5','Pięcioro lub więcej']]},
{id:'spec',when:c=>c.A.spec_open,t:c=>'Przykro mi, że musisz przez to przechodzić. Powiedz, czego dotyczy sytuacja, a pokażę tylko to, co ważne teraz. Możesz też wrócić do zwykłej rozmowy.',type:'choice',o:c=>[['martwe','Martwe urodzenie'],['zgon','Śmierć dziecka po porodzie'],['poronienie','Poronienie'],['anuluj','Wróć do rozmowy']]},
{id:'data_zgonu',when:c=>c.A.spec==='zgon',t:c=>'Kiedy to się stało? Data jest potrzebna do ustalenia okresu zasiłku.',type:'date',min:-2200,max:0},
...KIDQ,
{id:'mama_status',when:c=>c.typ==='tata'&&!c.spec,t:c=>'Czy mama dziecka może sama opiekować się dzieckiem?',type:'choice',o:c=>[['tak','Tak'],['szpital','Jest w szpitalu'],['orzeczenie','Ma orzeczenie o niezdolności do samodzielnej egzystencji'],['smierc','Zmarła'],['porzucenie','Porzuciła dziecko']]},
{id:'mama_ubezp',when:c=>c.typ==='tata'&&!c.spec,t:c=>'Czy mama dziecka była ubezpieczona w dniu porodu (praca, zlecenie, firma)?',type:'choice',o:c=>[['tak','Tak'],['nie','Nie'],['niewiem','Nie wiem']]},
{id:'drugi',when:c=>c.k&&c.ins&&!c.spec&&c.typ!=='tata',t:c=>'Czy drugi rodzic też weźmie część urlopu? Dzięki temu policzę podział.',type:'choice',o:c=>c.typ==='mama'?[['rodz','Tak, część rodzicielskiego'],['przej','Przejmie część macierzyńskiego po 14 tyg.'],['nie','Nie'],['niewiem','Jeszcze nie wiemy']]:[['rodz','Tak, część rodzicielskiego'],['nie','Nie'],['niewiem','Jeszcze nie wiemy']]},
{id:'drugi_tyg',when:c=>c.A.drugi==='rodz'&&!c.spec&&c.k,t:c=>`Ile tygodni rodzicielskiego weźmie drugi rodzic? Minimum ${CFG.nieprzen} tyg. przysługuje tylko jemu; cała pula to ${c.pool} tyg.`,type:'number',min:CFG.nieprzen,max:c=>c.pool,def:CFG.nieprzen,unit:'tyg.'},
{id:'drugi_brutto',when:c=>(c.A.drugi==='rodz'||c.A.drugi==='przej')&&!c.spec&&c.k,t:c=>'Ile średnio zarabia drugi rodzic brutto? Policzę też jego zasiłek. Wpisz 0, jeśli wolisz pominąć.',type:'number',min:0,max:100000,def:0,unit:'zł'},
{id:'tata_tyg',when:c=>!c.k&&c.ins&&!c.spec,t:c=>`Ile tygodni urlopu rodzicielskiego chcesz wziąć? ${CFG.nieprzen} tyg. przysługuje tylko Tobie i przepada, jeśli ich nie wykorzystasz.`,type:'number',min:0,max:c=>c.pool,def:CFG.nieprzen,unit:'tyg.'},
{id:'w815',when:c=>c.typ==='mama'&&c.ins&&!c.spec&&(c.A.etap==='ciaza'||c.dniOdPorodu<=CFG.okno815),t:c=>`Jak wolisz dostawać zasiłek: ${pc(CFG.st815)}% przez cały okres (wniosek do ${CFG.okno815} dni po porodzie) czy ${CFG.stMac}% za macierzyński i ${CFG.stRodz}% za rodzicielski?`,type:'choice',o:c=>[['815',`Równo ${pc(CFG.st815)}%`],['100_70',`${CFG.stMac}% + ${CFG.stRodz}%`],['niewiem','Pokaż oba warianty']]},
{id:'laczenie',when:c=>c.forma==='uop'&&!c.spec,t:c=>'Chcesz w czasie urlopu rodzicielskiego wrócić do pracy na część etatu? Urlop wtedy się wydłuża.',type:'choice',o:c=>[['nie','Nie'],['0.25','Tak, na ćwierć etatu'],['0.5','Tak, na pół etatu']]},
{id:'konto_ok',when:c=>c.ins&&!c.p.manual,t:c=>`Wypłata na rachunek z profilu ZUS: ${c.p.dane.konto}. Zgadza się?`,type:'yesno'},
{id:'konto',when:c=>c.ins&&(c.A.konto_ok===false||c.p.manual),t:c=>'Podaj numer rachunku do wypłaty: 2 litery kodu kraju (np. PL) i 26 cyfr. W prototypie nie jest nigdzie wysyłany.',type:'text',opt:true}
];
const qById=Object.fromEntries(Q.map(q=>[q.id,q]));

function seq(){
const c=ctx(),out=[];
for(const q of Q){if(!q.when(c))continue;if(q.id in S.A){out.push({q,a:S.A[q.id]})}else{if(S.A.rola&&('etap' in S.A)&&compute().blocked)break;out.push({q,cur:true});break}}
return out;
}
function label(q,v){
const c=ctx();
if(v===null||v===undefined||v==='')return 'Pominięto';
if(q.type==='yesno')return v?'Tak':'Nie';
if(q.type==='date')return fmt(v);
if(q.type==='number')return v+' '+(q.unit||'');
if(q.type==='choice'){const o=q.o(c).find(x=>x[0]===v);return o?o[1]:v}
if(q.type==='multi'){const o=q.o(c);return (v||[]).map(x=>(o.find(y=>y[0]===x)||[x,x])[1]).join(', ')||'Pominięto'}
return String(v);
}
