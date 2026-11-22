/* Dostawca AI: Gemini API (Google); analiza odpowiedzi przez model */
/* Gemini używa lokalnego endpointu. Artefakt claude.ai nadal może używać Claude. */
const GEM=window.APP_CONFIG?.gemini||{};
/* ---------- Gemini API (generateContent) ---------- */
/* schemat narzędzia -> format Gemini; obiekt bez pól (np. „zmiany”) Gemini odrzuca, więc przekazujemy go jako tekst JSON */
function gemSchema(s,jsonKeys,key){
 s=s||{};const t=s.type||'string',d=s.description?{description:s.description}:{};
 if(t==='object'){const props=s.properties||{},keys=Object.keys(props);
  if(!keys.length){if(jsonKeys&&key)jsonKeys.push(key);return {type:'string',description:(s.description?s.description+'. ':'')+'Podaj jako tekst JSON, np. {"drugi":"rodz","drugi_tyg":12}.'}}
  const out={type:'object',properties:{},...d};for(const k of keys)out.properties[k]=gemSchema(props[k],jsonKeys&&!key?jsonKeys:null,k);if(s.required)out.required=s.required;return out}
 if(t==='array')return {type:'array',items:gemSchema(s.items||{type:'string'}),...d};
 return {type:t,...d,...(s.enum?{enum:s.enum}:{})}}
/* adapter o tym samym interfejsie co window.claude.use('sample'): LLM(prompt|turns,opts) -> {text}, LLM.json(), LLM.limits() */
function geminiLLM(){
 const post=async(body,signal)=>{
  let res;
  try{res=await fetch('/api/gemini',{method:'POST',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
  catch(e){if(e&&e.name==='AbortError')throw {code:'cancelled'};throw {code:'network',message:'Brak połączenia z Gemini API.'}}
  let data=null;try{data=await res.json()}catch(e){}
  if(!res.ok||(data&&data.error)){const er=(data&&data.error)||{},m=er.message||('HTTP '+res.status),st=res.status;
   const auth=st===401||st===403||/API key|API_KEY/i.test(m);
   throw {code:auth?'auth':st===402||/credits|billing|prepay/i.test(m)?'credits':st===429?'rate_limited':'http',message:String(m)}}
  return data};
 const call=async(input,opts={})=>{
  // rozmowa -> contents (role user/model, kolejne wypowiedzi tej samej roli łączone)
  const contents=[];
  for(const t of (typeof input==='string'?[{role:'user',content:input}]:input)){const role=t.role==='assistant'?'model':'user',text=String(t.content??'');
   const last=contents[contents.length-1];if(last&&last.role===role)last.parts.push({text});else contents.push({role,parts:[{text}]})}
  if(opts.images?.length)throw {code:'http',message:'W tym trybie Gemini przyjmuje tylko tekst.'};
  const tools=opts.tools||null,jsonArgs={};
  const body={contents,generationConfig:{maxOutputTokens:opts.maxTokens||8192,...(opts.json?{temperature:0.2}:{temperature:opts.temperature??0.8})}};
  if(GEM.systemInstruction)body.systemInstruction={parts:[{text:GEM.systemInstruction}]};
  if(opts.json)body.generationConfig.responseMimeType='application/json';
  if(tools)body.tools=[{functionDeclarations:tools.map(t=>{const jk=[];const d={name:t.name,description:t.description};if(t.inputSchema)d.parameters=gemSchema(t.inputSchema,jk);jsonArgs[t.name]=jk;return d})}];
  for(let step=0;step<8;step++){
   const data=await post(body,opts.signal);
   const cand=data&&data.candidates&&data.candidates[0];
   if(!cand){const br=data&&data.promptFeedback&&data.promptFeedback.blockReason;throw {code:'http',message:br?'Model odrzucił zapytanie ('+br+').':'Pusta odpowiedź modelu.'}}
   const parts=(cand.content&&cand.content.parts)||[],calls=parts.filter(x=>x.functionCall);
   if(tools&&calls.length){
    contents.push(cand.content);const resp=[];
    for(const p of calls){const fc=p.functionCall,t=tools.find(x=>x.name===fc.name);let out;
     try{if(!t)throw new Error('Nieznane narzędzie '+fc.name);const args={...(fc.args||{})};
      for(const k of (jsonArgs[fc.name]||[]))if(typeof args[k]==='string'){try{args[k]=JSON.parse(args[k])}catch(e){throw new Error('Pole '+k+' musi być poprawnym JSON')}}
      out=await t.execute(args)}
     catch(e){out={blad:e&&e.message||String(e)}}
     resp.push({functionResponse:{name:fc.name,...(fc.id?{id:fc.id}:{}),response:{result:out===undefined?null:out}}})}
    contents.push({role:'user',parts:resp});continue}
   const text=parts.filter(x=>x.text&&!x.thought).map(x=>x.text).join('');
   if(!text&&cand.finishReason&&cand.finishReason!=='STOP')throw {code:'http',message:'Model nie odpowiedział (powód: '+cand.finishReason+').'};
   if(opts.onText)opts.onText({text});
   return {text}}
  throw {code:'http',message:'Model wywołał zbyt wiele narzędzi z rzędu.'}};
 call.json=async(prompt,opts={})=>{
  const r=await call(prompt+'\n\nOdpowiedz wyłącznie poprawnym obiektem JSON, bez komentarzy i bez bloku kodu.',{...opts,json:true});
  let t=(r.text||'').replace(/```(?:json)?/gi,'').trim();const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a)t=t.slice(a,b+1);
  try{return JSON.parse(t)}catch(e){throw {code:'invalid_json',message:'Model nie zwrócił poprawnego JSON.'}}};
 call.limits=async()=>({tools:true});
 return call}
let LLM=null,LLM_SRC=null,CLAUDE_LLM=null;
function pickLLM(){if(GEM.enabled===true){LLM=geminiLLM();LLM_SRC='gemini'}else if(CLAUDE_LLM){LLM=CLAUDE_LLM;LLM_SRC='claude'}else{LLM=null;LLM_SRC=null}}
pickLLM();
(async()=>{try{if(window.claude&&window.claude.use)CLAUDE_LLM=await window.claude.use('sample')}catch(e){CLAUDE_LLM=null}pickLLM()})();
async function askLLM(q,text,c){
 if(!LLM)return null;
 const ty={yesno:'true albo false',date:'data w formacie YYYY-MM-DD',number:'liczba'+(q.unit?' ('+q.unit+')':''),choice:'jedna z dozwolonych wartości',text:'tekst',multi:'obiekt (opis niżej)'}[q.type];
 let prompt=`Analizujesz odpowiedź użytkownika w polskim kreatorze wniosku o zasiłek macierzyński. Dzisiaj jest ${TODAY}.\nPytanie: "${q.t(c)}"\nTyp odpowiedzi: ${ty}.\n`;
 if(q.type==='choice')prompt+='Dozwolone wartości: '+q.o(c).map(o=>`"${o[0]}" = ${o[1]}`).join('; ')+'.\n';
 if(q.type==='multi')prompt+=`Ustal, które dane o zatrudnieniu się zmieniły. Zwróć {"fields": tablica z wartości "forma","platnik","od","koniec","dobr","brutto", "vals": obiekt z kluczami tylko gdy użytkownik podał wartość: "forma_m" ("uop"|"zlecenie"|"jdg"|"brak"), "platnik_m" (nazwa firmy), "od_m" (YYYY-MM-DD), "koniec_m" ("bezterminowa"|"data"), "koniec_d" (YYYY-MM-DD), "dobr_m" (true|false), "brutto_m" (liczba zł brutto miesięcznie)}.\n`;
 prompt+=`Odpowiedź użytkownika: """${text.slice(0,600)}"""\nZwróć wyłącznie JSON: {"value": ..., "pewnosc": liczba 0-1, "dopytaj": "krótkie pytanie po polsku, gdy odpowiedź jest niejasna, inaczej pusty tekst"}. Gdy nie da się ustalić, value = null.`;
 try{let r=await LLM.json(prompt,{modelTier:'quick',cache:false});if(typeof r==='string'){try{r=JSON.parse(r)}catch(e){return null}}return r&&typeof r==='object'?r:null}
 catch(e){if(e&&e.code==='not_granted')LLM=null;return null}}
