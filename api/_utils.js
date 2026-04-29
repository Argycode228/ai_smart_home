const OPENAI_API_BASE = 'https://api.openai.com/v1';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  sendJson(res, statusCode, {
    error: error.code || 'request_failed',
    message: error.message || 'Request failed',
  });
}

function ensureMethod(req, res, method) {
  if (req.method === method) return true;
  res.setHeader('Allow', method);
  sendJson(res, 405, {
    error: 'method_not_allowed',
    message: `Use ${method}.`,
  });
  return false;
}

function readJson(req) {
  if (req.body) {
    if (typeof req.body === 'string') {
      return Promise.resolve(JSON.parse(req.body || '{}'));
    }
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (error) {
        reject(Object.assign(new Error('Invalid JSON body.'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function requireOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('OPENAI_API_KEY is not configured in Vercel environment variables.'), {
      statusCode: 500,
      code: 'missing_openai_key',
    });
  }
  return apiKey;
}

function cleanString(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

async function openaiJson(path, payload, options = {}) {
  const apiKey = requireOpenAIKey();
  const response = await fetch(`${OPENAI_API_BASE}${path}`, {
    method: options.method || 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data?.error?.message || data?.message || text || 'OpenAI API request failed.';
    throw Object.assign(new Error(message), {
      statusCode: response.status,
      code: data?.error?.code || 'openai_error',
    });
  }

  return data;
}

function extractResponseText(data) {
  if (typeof data?.output_text === 'string') return data.output_text.trim();

  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') parts.push(content.text);
      if (typeof content.output_text === 'string') parts.push(content.output_text);
    }
  }

  return parts.join('\n').trim();
}

module.exports = {
  OPENAI_API_BASE,
  cleanString,
  ensureMethod,
  extractResponseText,
  openaiJson,
  readJson,
  requireOpenAIKey,
  sendError,
  sendJson,
};
