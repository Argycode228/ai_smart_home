import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildWeeklyReport,
  calculateKpis,
  createNotificationPayload,
  filterRequests,
  seedRequests,
} from '../src/domain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4173);
const now = new Date('2026-05-02T10:00:00+05:00');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

async function serveStatic(req, res, pathname) {
  const normalized = pathname === '/' ? '/index.html' : pathname;
  const requestedPath = path.normalize(decodeURIComponent(normalized)).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(rootDir, requestedPath);

  if (!filePath.startsWith(rootDir)) {
    sendJson(res, 403, { error: 'forbidden' });
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error('Not a file');

    const content = await readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: 'not_found', message: 'Resource not found.' });
  }
}

async function handleApi(req, res, url) {
  if (url.pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'crm-ops-platform',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === '/api/requests' && req.method === 'GET') {
    const filters = {
      query: url.searchParams.get('query') || '',
      status: url.searchParams.get('status') || 'all',
      owner: url.searchParams.get('owner') || 'all',
    };
    sendJson(res, 200, {
      data: filterRequests(seedRequests, filters),
      filters,
    });
    return;
  }

  if (url.pathname === '/api/kpis' && req.method === 'GET') {
    sendJson(res, 200, {
      data: calculateKpis(seedRequests, now),
    });
    return;
  }

  if (url.pathname === '/api/reports/weekly' && req.method === 'GET') {
    sendJson(res, 200, {
      data: buildWeeklyReport(seedRequests, now),
    });
    return;
  }

  if (url.pathname === '/api/notifications' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const request = seedRequests.find((item) => item.id === body.requestId) || seedRequests[0];
      sendJson(res, 201, {
        data: createNotificationPayload(request, body.channel || 'email', now),
      });
    } catch (error) {
      sendJson(res, 400, {
        error: 'bad_request',
        message: error.message,
      });
    }
    return;
  }

  sendJson(res, 404, {
    error: 'api_not_found',
    message: 'API endpoint not found.',
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health' || url.pathname.startsWith('/api/')) {
    await handleApi(req, res, url);
    return;
  }

  await serveStatic(req, res, url.pathname);
});

server.listen(port, () => {
  console.log(`CRM Operations Platform running at http://localhost:${port}`);
});
