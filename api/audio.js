const {
  OPENAI_API_BASE,
  cleanString,
  ensureMethod,
  readJson,
  requireOpenAIKey,
  sendError,
  sendJson,
} = require('./_utils');
const { Readable } = require('node:stream');

module.exports = async function handler(req, res) {
  if (!ensureMethod(req, res, 'POST')) return;

  try {
    const body = await readJson(req);
    const input = cleanString(body.prompt, 1800);

    if (!input) {
      sendJson(res, 400, {
        error: 'prompt_required',
        message: 'Prompt is required.',
      });
      return;
    }

    const apiKey = requireOpenAIKey();
    const response = await fetch(`${OPENAI_API_BASE}/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
        voice: process.env.OPENAI_TTS_VOICE || 'alloy',
        input,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw Object.assign(new Error(details || 'OpenAI speech request failed.'), {
        statusCode: response.status,
        code: 'openai_audio_error',
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
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
