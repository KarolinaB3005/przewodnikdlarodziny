/* Rozumienie odpowiedzi pisanych własnymi słowami (daty, liczby, słowa kluczowe) */
const PLN={zero:0,jeden:1,jedno:1,jedna:1,jednego:1,dwa:2,dwie:2,dwoje:2,trzy:3,troje:3,cztery:4,czworo:4,'pięć':5,'pięcioro':5,'sześć':6,siedem:7,osiem:8,'dziewięć':9,'dziesięć':10,'jedenaście':11,'dwanaście':12,'trzynaście':13,'czternaście':14,'piętnaście':15,'szesnaście':16,'siedemnaście':17,'osiemnaście':18,'dziewiętnaście':19,'dwadzieścia':20};
const MON=['stycz','lut','mar','kwie','maj','czerw','lip','sierp','wrze','paźdz','listop','grud'];
const lc=s=>String(s).toLowerCase().replace(/\s+/g,' ').trim();
const mk=(y,mo,d)=>{const dt=new Date(y,mo-1,d,12);return (dt.getMonth()===mo-1&&d>=1)?iso(dt):null};
function numIn(t){t=lc(t);const m=t.match(/(\d[\d\s]*(?:[.,]\d+)?)\s*(tys|k\b)?/);if(m){let v=parseFloat(m[1].replace(/\s/g,'').replace(',','.'));if(m[2])v*=1000;return v}for(const [w,v] of Object.entries(PLN))if(new RegExp('(^|[^a-ząćęłńóśźż])'+w+'($|[^a-ząćęłńóśźż])').test(t))return v;if(/\bpół\b/.test(t))return 0.5;return null}
function validDate(q,v){if(!v)return 'Podaj datę.';const dd=diff(TODAY,v);
 if(q.id==='termin'&&dd<0)return 'Termin porodu nie może być w przeszłości. Jeśli dziecko już się urodziło, cofnij się i wybierz „Dziecko już jest”.';
 if(q.id==='data_porodu'&&dd>0)return 'Data urodzenia nie może być w przyszłości. Jeśli czekacie na dziecko, cofnij się i wybierz ciążę.';
 if(q.id==='data_zgonu'&&S.A.data_porodu&&diff(S.A.data_porodu,v)<0)return 'Data nie może być wcześniejsza niż data porodu.';
 if(q.min!==undefined&&dd<q.min)return 'Ta data jest za daleko w przeszłości.';
 if(q.max!==undefined&&dd>q.max)return 'Ta data jest za daleko w przyszłości.';
 return ''}
function nearYear(mo,d,q){const y=new Date().getFullYear();const cs=[y,y+1,y-1].map(Y=>mk(Y,mo,d)).filter(Boolean);for(const v of cs)if(!q||!validDate(q,v))return v;return cs[0]||null}
function dateIn(t,q){t=lc(t);let m;
 const unit=s=>/^(dz|dni)/.test(s)?1:/^(tydz|tyg)/.test(s)?7:/^mies/.test(s)?30:/^(rok|lat)/.test(s)?365:0;
 const U='(dni|dzień|dnia|tydzień|tygodni|tygodnie|miesiąc|miesiące|miesięcy|rok|lata|lat)';
 if(m=t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))return mk(+m[1],+m[2],+m[3]);
 if(m=t.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/))return mk(+m[3]<100?2000+(+m[3]):+m[3],+m[2],+m[1]);
 if(m=t.match(/(\d{1,2})\s+([a-ząćęłńóśźż]+)(?:\s+(\d{4}))?/)){const mi=MON.findIndex(s=>m[2].startsWith(s));if(mi>=0)return m[3]?mk(+m[3],mi+1,+m[1]):nearYear(mi+1,+m[1],q)}
 if(m=t.match(/(^|\s)(\d{1,2})[.\/](\d{1,2})(?![.\/\d])/))return nearYear(+m[3],+m[2],q);
 if(m=t.match(new RegExp('za\\s+(\\S+)\\s+'+U))){const n=numIn(m[1])??1,u=unit(m[2]);return u===30?addM(TODAY,n):addD(TODAY,n*u)}
 if(m=t.match(/za\s+(tydzień|miesiąc|rok)/)){const u=unit(m[1]);return u===30?addM(TODAY,1):addD(TODAY,u)}
 if(m=t.match(new RegExp('(\\S+)\\s+'+U+'\\s+temu'))){const n=numIn(m[1])??1,u=unit(m[2]);return u===30?addM(TODAY,-n):addD(TODAY,-n*u)}
 if(m=t.match(new RegExp(U+'\\s+temu'))){const u=unit(m[1]);return u===30?addM(TODAY,-1):addD(TODAY,-u)}
 if(q&&q.id==='termin'&&(m=t.match(/(\d{1,2})\s*\.?\s*(tydz|tyg|tc)/))){const w=+m[1];if(w>=4&&w<=42)return addD(TODAY,(40-w)*7)}
 if(/\b(dziś|dzisiaj)\b/.test(t))return TODAY;
 if(/\bprzedwczoraj\b/.test(t))return addD(TODAY,-2);
 if(/\bwczoraj\b/.test(t))return addD(TODAY,-1);
 if(/\bpojutrze\b/.test(t))return addD(TODAY,2);
 if(/\bjutro\b/.test(t))return addD(TODAY,1);
 return null}
function yesNo(t){t=lc(t);if(/nie wiem|nie jestem pew/.test(t))return null;
 if(/(nie zgadza|nieaktual|nieprawd|zmieni|już nie|błąd|\bźle\b|^nie\b|\bnie\b)/.test(t))return false;
 if(/(^tak|\btak\b|zgadza|jasne|owszem|oczywiście|pewnie|dokładnie|\bok\b|okej|\bmhm\b|potwierdzam|zgoda|\byes\b)/.test(t))return true;return null}
const r3=(re,w=3)=>[re,w];
const SYN={
rola:{mama:[r3(/\b(mam[aąy]|matk|jestem w ciąży|ciężarn|kobiet)/)],tata:[r3(/\b(tat[aąo]|ojc|ojciec|partnerka jest w ciąży|żona jest w ciąży|będę ojcem)/)],adop_k:[r3(/(adopc|przysposob|adoptuj)/,2),r3(/(mam|matk|kobiet|adoptuję)/,2)],adop_m:[r3(/(adopc|przysposob|adoptuj)/,2),r3(/(tat|ojc|mężczyzn)/,2)],zast_k:[r3(/(zastępcz)/,4),r3(/(mam|matk)/,1)],zast_m:[r3(/(zastępcz)/,4),r3(/(tat|ojc)/,1)]},
etap:{ciaza:[r3(/(ciąż|spodziewa|czekamy|termin|urodzi się|będzie|w drodze)/)],po:[r3(/(urodził|jest już|już jest|po porodzie|mamy dziecko|na świecie|przyjęli|przyjęłam|przyjąłem|jest u nas|mamy już)/,4)],plan:[r3(/(dopiero|planuj|będziemy|przyjm(ę|iemy)|jeszcze nie)/)]},
zmiana:{nie:[r3(/(\bnie\b|zostaje|bez zmian|wszystko ok|nic się nie)/,1)],konczy:[r3(/(kończy|wygasa|koniec umowy|zamyk|zamknę|likwid|nie przedłuż)/,4)],zmiana:[r3(/(zmieni|now[ąa] prac|odchodz|inna praca|nowa firma)/,4)]},
l4:{},
start_przed:{tak:[r3(/(^tak|\btak\b|chcę|wcześniej|przed porodem|od razu|jak najszybciej|już teraz)/)],nie:[r3(/(^nie\b|od porodu|po porodzie|do porodu pracuj|do końca)/)],niewiem:[r3(/(nie wiem|zobaczę|nie jestem pew|zastanowi)/,6)]},
liczba:{'1':[r3(/(\bjedn|\b1\b|jedynak)/)],'2':[r3(/(\bdw|bliźni|\b2\b)/)],'3':[r3(/(\btrz|troj|\b3\b)/)],'4':[r3(/(czter|czwor|\b4\b)/)],'5':[r3(/(pię|\b5\b|więcej)/)]},
spec:{martwe:[r3(/martw/)],zgon:[r3(/(zmarł|śmier|odeszł|nie żyje)/)],poronienie:[r3(/poroni/)],anuluj:[r3(/(wróć|anuluj|pomyłk|przez przypadek)/)]},
hosp:{nie:[r3(/(\bnie\b|w domu|zdrow|wszystko dobrze)/,1)],wczesniak:[r3(/(wcześnia|przed czasem|za wcześnie|przedwczesn)/,5)],hosp:[r3(/(szpital|hospitaliz|oiom|inkubator|neonatolog)/,3)]},
zazycie:{nie:[r3(/\bnie\b/,1)],tak:[r3(/(\btak\b|ma zaświadczenie|dostał|mamy)/)],niewiem:[r3(/(nie wiem|nie jestem pew)/,6)]},
mama_status:{tak:[r3(/(\btak\b|może|zdrowa|w porządku|wszystko dobrze)/,1)],szpital:[r3(/szpital/,5)],orzeczenie:[r3(/(orzecz|niezdoln|niesamodziel)/,5)],smierc:[r3(/(zmarł|nie żyje|śmier)/,5)],porzucenie:[r3(/(porzuc|zostawił|zostawiła|odeszła od)/,5)]},
mama_ubezp:{tak:[r3(/(\btak\b|pracuje|etat|zlecen|firm|ubezpieczon)/,2)],nie:[r3(/(nie pracuje|bezrobot|studentk|\bnie\b)/,3)],niewiem:[r3(/(nie wiem|nie jestem pew)/,6)]},
drugi:{rodz:[r3(/(rodzicielsk|część|\btak\b|weźmie|chce wziąć)/,2)],przej:[r3(/(przejmie|przejąć|macierzyńsk|po 14)/,4)],nie:[r3(/(\bnie\b|sama|sam\b)/,2)],niewiem:[r3(/(nie wiem|nie wiemy|zobaczymy|jeszcze nie ustalil)/,6)]},
w815:{'815':[r3(/(81|równo|tyle samo|jednakow|stał)/)],'100_70':[r3(/(100|70|najpierw więcej|na początku więcej)/)],niewiem:[r3(/(nie wiem|porówna|\boba\b|obie|obydw|\bobu\b|dwie opcje|dwa warianty|dwóch wariant|pokaż|pokaz|zestaw|nie jestem pew)/,5)]},
laczenie:{nie:[r3(/(\bnie\b|całkiem|w domu)/,1)],'0.25':[r3(/(ćwierć|1\/4|0[.,]25)/,4)],'0.5':[r3(/(pół|połow|1\/2|0[.,]5)/,4)]},
typ_zast:{niezawodowa:[r3(/niezawod/,5)],zawodowa:[r3(/(^|[^e])zawod/,3)]},
forma_m:{uop:[r3(/(umow[aęy]? o prac|etat|pracownik|na umowie o)/)],zlecenie:[r3(/zlecen/)],jdg:[r3(/(działalno|własn\w* firm|jdg|b2b|samozatrud|przedsiębior)/)],brak:[r3(/(nie pracuj|bezrobot|student|brak|nie mam pracy|zwolnion)/)]},
ponad20_m:{tak:[r3(/(\btak\b|duż|więcej|korporac|ponad|setk|kilkadziesiąt)/)],nie:[r3(/(\bnie\b|mał|mniej|kilka|parę)/)],niewiem:[r3(/(nie wiem|nie jestem pew)/,6)]},
koniec_m:{bezterminowa:[r3(/(nieokreślon|bezterminow|na stałe|stała)/,5)],data:[r3(/(określon|kończy|\bdo\s|\d)/)]}
};
function choiceIn(q,t,c){t=lc(t);const opts=q.o(c),syn=SYN[q.base||q.id]||{};let best=null,bs=0,tie=false;
 for(const [v,l] of opts){let s=0;(syn[v]||[]).forEach(([re,w])=>{if(re.test(t))s+=w});
  lc(l).split(/[^a-ząćęłńóśźż0-9]+/).filter(w=>w.length>=4).forEach(w=>{if(t.includes(w.slice(0,Math.max(4,w.length-2))))s+=1});
  if(s>bs){bs=s;best=v;tie=false}else if(s===bs&&s>0)tie=true}
 if(best&&!tie)return best;
 const yn=yesNo(t);if(yn!==null){const o=opts.find(o=>o[0]===(yn?'tak':'nie'));if(o)return o[0]}
 return null}
function fixExtract(text){const t=lc(text),fields=new Set(),vals={};let m;
 const fm=choiceIn(qById.forma_m,t,ctx());const fmSyn=Object.values(SYN.forma_m).some(a=>a.some(([re])=>re.test(t)));
 if(fm&&fmSyn){fields.add('forma');vals.forma_m=fm}
 if(/(forma|rodzaj umowy|typ umowy)/.test(t))fields.add('forma');
 if(/(pracodawc|firm[aęyie]|zleceniodawc|zmieni\w* prac|now\w* prac|inn\w* prac|inn\w* firm|zakład)/.test(t))fields.add('platnik');
 if(m=t.match(/\bod\s+([^,;]+)/)){const d=dateIn(m[1],qById.od_m);if(d&&!validDate(qById.od_m,d)){fields.add('od');vals.od_m=d}}
 if(/(od kiedy|data rozpocz|zaczęł\w* prac|zacząłem)/.test(t))fields.add('od');
 if(/(bezterminow|nieokreślon)/.test(t)){fields.add('koniec');vals.koniec_m='bezterminowa'}
 else if(m=t.match(/\bdo\s+([^,;]+)/)){const d=dateIn(m[1],qById.koniec_d);if(d){fields.add('koniec');vals.koniec_m='data';vals.koniec_d=d}}
 if(/(koniec umowy|kończy|wygasa|przedłuż|czas określon)/.test(t))fields.add('koniec');
 if(/(dobrowoln|chorobow)/.test(t)){fields.add('dobr');if(/(nie (opłacam|płacę|mam|jestem)|zrezygnow|wyrejestr|przestał)/.test(t))vals.dobr_m=false;else if(/(opłacam|płacę|zgłosił|mam|jestem)/.test(t))vals.dobr_m=true}
 if(m=t.match(/(\d[\d\s]*(?:[.,]\d+)?)\s*(zł|pln|tys|brutto)/)){const v=numIn(m[0]);if(v>=300){fields.add('brutto');vals.brutto_m=v}}
 if(/(zarab|pensj|wynagrodz|brutto|podstaw|wypłat)/.test(t))fields.add('brutto');
 return {fields:[...fields],vals}}
/* numer rachunku: 2 litery (kod kraju, np. PL) + 26 cyfr; spacje i myślniki są pomijane, zapis w grupach po 4 znaki */
const ibanRaw=t=>String(t||'').replace(/[\s-]/g,'').toUpperCase();
const ibanOk=t=>/^[A-Z]{2}\d{26}$/.test(ibanRaw(t));
const ibanFmt=t=>ibanRaw(t).replace(/(.{4})(?=.)/g,'$1 ');
const ibanErr=t=>{const r=ibanRaw(t);if(!/^[A-Z]{2}/.test(r))return 'Numer rachunku musi zaczynać się od dwóch liter kodu kraju, np. PL.';const d=r.slice(2);if(/\D/.test(d))return 'Po dwóch literach mogą być tylko cyfry.';return `Po literach potrzeba 26 cyfr, a jest ${d.length}.`};
function local(q,text,c){
 if(q.id==='konto')return text.trim()?(ibanOk(text)?ibanFmt(text):text.trim()):null;
 if(q.type==='yesno')return yesNo(text);
 if(q.type==='choice')return choiceIn(q,text,c);
 if(q.type==='date')return dateIn(text,q);
 if(q.type==='number'){const v=numIn(text);return v===null?null:v}
 if(q.type==='text')return text.trim()||null;
 return null}
function validOf(q,v,c){
 if(q.id==='konto'&&v)return ibanOk(v)?'':ibanErr(v);
 if(v===null||v===undefined)return 'empty';
 if(q.type==='yesno')return typeof v==='boolean'?'':'empty';
 if(q.type==='choice')return q.o(c).some(o=>o[0]===v)?'':'empty';
 if(q.type==='date')return /^\d{4}-\d{2}-\d{2}$/.test(v)?validDate(q,v):'empty';
 if(q.type==='number'){const mx=typeof q.max==='function'?q.max(c):q.max;if(typeof v!=='number'||isNaN(v))return 'empty';return (v<q.min||v>mx)?`Podaj wartość od ${q.min} do ${mx}${q.unit?' '+q.unit:''}.`:''}
 return ''}
