const { createApp } = require('./server.cjs');

const OLLAMA = 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL || 'SpeakLeash/bielik-11b-v3.0-instruct:Q4_K_M';

function toMessages(body) {
  const messages = [];
  const system = body.systemInstruction?.parts?.map(part => part.text || '').join('\n');
  if (system) messages.push({ role: 'system', content: system });

  for (const turn of body.contents) {
    const text = turn.parts.map(part => part.text || '').filter(Boolean).join('\n');
    const calls = turn.parts.filter(part => part.functionCall).map(({ functionCall }, index) => ({
      type: 'function',
      function: { index, name: functionCall.name, arguments: functionCall.args || {} },
    }));

    if (text || calls.length) {
      const message = { role: turn.role === 'model' ? 'assistant' : 'user', content: text };
      if (calls.length) message.tool_calls = calls;
      messages.push(message);
    }

    for (const { functionResponse } of turn.parts) {
      if (functionResponse) {
        messages.push({
          role: 'tool',
          tool_name: functionResponse.name,
          content: JSON.stringify(functionResponse.response),
        });
      }
    }
  }

  return messages;
}

function createBielikApp(request = fetch) {
  return createApp({
    // Wartość techniczna, która włącza istniejący widok asystenta.
    apiKey: 'ollama-local',
    request: async (_url, { body }) => {
      const prompt = JSON.parse(body);
      const tools = (prompt.tools || []).flatMap(group => group.functionDeclarations || [])
        .map(fn => ({
          type: 'function',
          function: { parameters: { type: 'object', properties: {} }, ...fn },
        }));
      const config = prompt.generationConfig || {};
      const chat = {
        model: MODEL,
        messages: toMessages(prompt),
        stream: false,
        options: {
          num_ctx: 8192,
          num_predict: Math.min(config.maxOutputTokens || 2048, 2048),
          temperature: config.temperature ?? 0.2,
        },
      };
      if (tools.length) chat.tools = tools;
      if (config.responseMimeType === 'application/json') chat.format = 'json';

      const res = await request(OLLAMA + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chat),
        signal: AbortSignal.timeout(120_000),
        redirect: 'error',
      }).catch(err => {
        const timeout = err.name === 'TimeoutError';
        const message = timeout
          ? 'Bielik przekroczył limit 120 sekund.'
          : 'Brak połączenia z lokalnym Ollama. Uruchom aplikację Ollama.';
        return Response.json({ error: message }, { status: timeout ? 504 : 502 });
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.message) {
        return Response.json(
          { error: { message: data?.error || 'Nieprawidłowa odpowiedź Ollama.' } },
          { status: res.ok ? 502 : res.status }
        );
      }

      const parts = [];
      if (data.message.content) parts.push({ text: data.message.content });
      for (const call of data.message.tool_calls || []) {
        parts.push({ functionCall: { name: call.function.name, args: call.function.arguments } });
      }

      return Response.json({ candidates: [{
        content: { role: 'model', parts },
        finishReason: data.done_reason === 'length' ? 'MAX_TOKENS' : 'STOP',
      }] });
    },
  });
}

async function start() {
  const tags = await fetch(OLLAMA + '/api/tags', {
    signal: AbortSignal.timeout(5_000),
    redirect: 'error',
  }).then(res => res.ok ? res.json() : null).catch(() => null);

  if (!tags) throw new Error('Uruchom Ollama, a potem powtórz polecenie.');
  if (!tags.models?.some(model => model.name?.toLowerCase() === MODEL.toLowerCase())) {
    throw new Error('Pobierz model poleceniem: ollama pull ' + MODEL);
  }

  const port = Number(process.env.PORT || 3001);
  createBielikApp()
    .on('error', err => {
      console.error(err.code === 'EADDRINUSE'
        ? 'Port ' + port + ' zajęty. Zatrzymaj dotychczasowy serwer przez Ctrl+C.'
        : err.message);
      process.exitCode = 1;
    })
    .listen(port, '127.0.0.1', () => {
      console.log('Przewodnik z Bielikiem działa na http://127.0.0.1:' + port);
    });
}

if (require.main === module) {
  start().catch(err => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

module.exports = { createBielikApp };