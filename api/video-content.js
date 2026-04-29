const {
  OPENAI_API_BASE,
  ensureMethod,
  requireOpenAIKey,
  sendError,
  sendJson,
} = require('./_utils');
const { Readable } = require('node:stream');

module.exports = async function handler(req, res) {
  if (!ensureMethod(req, res, 'GET')) return;

  try {
    const id = String(req.query?.id || '').trim();

    if (!id) {
      sendJson(res, 400, {
        error: 'video_id_required',
        message: 'Video id is required.',
      });
      return;
    }

    const apiKey = requireOpenAIKey();
    const response = await fetch(`${OPENAI_API_BASE}/videos/${encodeURIComponent(id)}/content`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const details = await response.text();
      throw Object.assign(new Error(details || 'OpenAI video download failed.'), {
        statusCode: response.status,
        code: 'openai_video_error',
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
    res.setHeader('Cache-Control', 'no-store');

    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.end(buffer);
    }
  } catch (error) {
    sendError(res, error);
  }
};
