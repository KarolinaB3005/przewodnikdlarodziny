const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const MAX_JSON = 256 * 1024;

function sendJSON(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function error(status, message) {
  return Object.assign(new Error(message), { status });
}

async function readJSON(req) {
  if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) {
    throw error(415, 'Wymagany format application/json.');
  }
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > MAX_JSON) {
      req.resume();
      throw error(413, 'Zapytanie jest za duże.');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks));
  } catch {
    throw error(400, 'Nieprawidłowy JSON.');
  }
}

function createApp({ apiKey = '', model = DEFAULT_MODEL, request = fetch } = {}) {
  apiKey = apiKey.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw Error('Nieprawidłowa wartość GEMINI_MODEL.');
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';

  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      if (!/^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(req.headers.host || '')) {
        throw error(403, 'Użyj adresu localhost lub 127.0.0.1.');
      }

      const url = new URL(req.url, 'http://localhost').pathname;
      if (url === '/api/gemini') {
        if (req.method !== 'POST') throw error(405, 'Użyj metody POST.');
        if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host) {
          throw error(403, 'Zapytanie musi pochodzić z tej samej strony.');
        }
        if (!apiKey) throw error(503, 'Ustaw GEMINI_API_KEY w pliku .env i uruchom serwer ponownie.');

        const body = await readJSON(req);
        if (!Array.isArray(body?.contents) || !body.contents.length ||
            body.contents.some(turn => !Array.isArray(turn?.parts) || turn.parts.some(part =>
              !part || part.inlineData || part.inline_data || part.fileData || part.file_data))) {
          throw error(400, 'Podaj wiadomości tekstowe. Przesyłanie plików do Gemini jest wyłączone.');
        }

        const upstream = await request(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        });
        const result = await upstream.json().catch(() => null);
        if (!upstream.ok) {
          const detail = result?.error?.message || 'Google Gemini API HTTP ' + upstream.status;
          const message = String(detail).replaceAll(apiKey, '[ukryto]').slice(0, 400);
          sendJSON(res, upstream.status, { error: { message } });
          return;
        }
        if (!result) throw error(502, 'Gemini zwróciło nieprawidłową odpowiedź.');
        sendJSON(res, 200, result);
        return;
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') throw error(405, 'Niedozwolona metoda.');

      if (url === '/js/config.js') {
        res.writeHead(200, {
          'Content-Type': 'text/javascript; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end('window.APP_CONFIG ??= ' + JSON.stringify({ gemini: { enabled: Boolean(apiKey) } }) + ';');
        return;
      }

      const file = url === '/' ? '/index.html' : url;
      if (!/^\/(?:index\.html|css\/style\.css|js\/\d{2}-[\w-]+\.js|assets\/(?:logo|logowanie)\.png)$/.test(file)) {
        throw error(404, 'Nie znaleziono pliku.');
      }
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.png': 'image/png',
      };
      const data = await fs.readFile(path.join(__dirname, file.slice(1)));
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (err) {
      const status = err.status || (err.code === 'ENOENT' ? 404 : err.name === 'TimeoutError' ? 504 : 502);
      const message = err.status ? err.message
        : status === 404 ? 'Nie znaleziono pliku.'
        : status === 504 ? 'Gemini nie odpowiedział w ciągu 30 sekund.'
        : 'Brak odpowiedzi od Gemini API.';
      sendJSON(res, status, { error: { message } });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createApp({ apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL })
    .listen(port, '127.0.0.1', () => console.log('Przewodnik działa na http://127.0.0.1:' + port));
}

module.exports = { createApp };
