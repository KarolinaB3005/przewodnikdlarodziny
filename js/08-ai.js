/* Dostawca AI: OpenRouter albo Claude na claude.ai; analiza odpowiedzi przez model */
/* ---------- dostawca AI: OpenRouter (klucz w przeglądarce) albo Claude w artefaktach claude.ai ---------- */
const OR_URL='https://openrouter.ai/api/v1/chat/completions';
const OR_MODELS=['anthropic/claude-opus-5.5','anthropic/claude-sonnet-5.5','anthropic/claude-haiku-5.5'];
const lsGet=k=>{try{return localStorage.getItem(k)||''}catch(e){return ''}};
const lsSet=(k,v)=>{try{v?localStorage.setItem(k,v):localStorage.removeItem(k)}catch(e){}};
const OR={key:lsGet('or_key'),model:lsGet('or_model')||OR_MODELS[0]};
const blobToDataURL=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Nie udało się wczytać obrazu'));r.readAsDataURL(b)});
/* adapter o tym samym interfejsie co window.claude.use('sample'): LLM(prompt|turns,opts) -> {text}, LLM.json(), LLM.limits() */
function openRouterLLM(){
 const post=async(body,signal)=>{
  let res;
  try{res=await fetch(OR_URL,{method:'POST',signal,headers:{'Authorization':'Bearer '+OR.key,'Content-Type':'application/json','X-Title':'Przewodnik przyszlego rodzica (prototyp)'},body:JSON.stringify(body)})}
  catch(e){if(e&&e.name==='AbortError')throw {code:'cancelled'};throw {code:'network',message:'Brak połączenia z OpenRouter.'}}
  let data=null;try{data=await res.json()}catch(e){}
  if(!res.ok||(data&&data.error)){const m=data&&data.error&&(data.error.message||data.error.code)||('HTTP '+res.status);const st=res.ok?(data.error.code||0):res.status;
   throw {code:st===401?'auth':st===402?'credits':st===429?'rate_limited':'http',message:String(m)}}
  return data};
 const call=async(input,opts={})=>{
  const msgs=typeof input==='string'?[{role:'user',content:input}]:input.map(t=>({role:t.role,content:t.content}));
  if(opts.images&&opts.images.length){const last=msgs[msgs.length-1];const urls=await Promise.all(opts.images.map(blobToDataURL));last.content=[{type:'text',text:String(last.content)},...urls.map(u=>({type:'image_url',image_url:{url:u}}))]}
  const tools=opts.tools||null;
  const body={model:OR.model,messages:msgs,max_tokens:opts.maxTokens||4000};
  if(tools)body.tools=tools.map(t=>({type:'function',function:{name:t.name,description:t.description,parameters:t.inputSchema||{type:'object',properties:{}}}}));
  for(let step=0;step<8;step++){
   const data=await post(body,opts.signal);
   const msg=data&&data.choices&&data.choices[0]&&data.choices[0].message;if(!msg)throw {code:'http',message:'Pusta odpowiedź modelu.'};
   if(tools&&msg.tool_calls&&msg.tool_calls.length){
    msgs.push({role:'assistant',content:msg.content||'',tool_calls:msg.tool_calls});
    for(const tc of msg.tool_calls){const t=tools.find(x=>x.name===tc.function.name);let out;
     try{if(!t)throw new Error('Nieznane narzędzie '+tc.function.name);let args={};try{args=JSON.parse(tc.function.arguments||'{}')}catch(e){throw new Error('Nieprawidłowe argumenty narzędzia')}out=await t.execute(args)}
     catch(e){out={blad:e&&e.message||String(e)}}
     msgs.push({role:'tool',tool_call_id:tc.id,content:JSON.stringify(out===undefined?null:out)})}
    continue}
   const text=typeof msg.content==='string'?msg.content:Array.isArray(msg.content)?msg.content.map(x=>x.text||'').join(''):'';
   if(opts.onText)opts.onText({text});
   return {text}}
  throw {code:'http',message:'Model wywołał zbyt wiele narzędzi z rzędu.'}};
 call.json=async(prompt,opts={})=>{
  const r=await call(prompt+'\n\nOdpowiedz wyłącznie poprawnym obiektem JSON, bez komentarzy i bez bloku kodu.',opts);
  let t=(r.text||'').replace(/```(?:json)?/gi,'').trim();const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a)t=t.slice(a,b+1);
  try{return JSON.parse(t)}catch(e){throw {code:'invalid_json',message:'Model nie zwrócił poprawnego JSON.'}}};
 call.limits=async()=>({tools:true,images:{maxCount:10}});
 return call}
let LLM=null,LLM_SRC=null,CLAUDE_LLM=null;
function pickLLM(){if(OR.key){LLM=openRouterLLM();LLM_SRC='openrouter'}else if(CLAUDE_LLM){LLM=CLAUDE_LLM;LLM_SRC='claude'}else{LLM=null;LLM_SRC=null}}
const llmName=()=>LLM_SRC==='openrouter'?OR.model+' (OpenRouter)':LLM_SRC==='claude'?'Claude (claude.ai)':'brak';
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
