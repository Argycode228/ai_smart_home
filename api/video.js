const {
  OPENAI_API_BASE,
  cleanString,
  ensureMethod,
  readJson,
  requireOpenAIKey,
  sendError,
  sendJson,
} = require('./_utils');

module.exports = async function handler(req, res) {
  if (!ensureMethod(req, res, 'POST')) return;

  try {
    const body = await readJson(req);
    const prompt = cleanString(body.prompt, 3000);

    if (!prompt) {
      sendJson(res, 400, {
        error: 'prompt_required',
        message: 'Prompt is required.',
      });
      return;
    }

    const apiKey = requireOpenAIKey();
    const model = process.env.OPENAI_VIDEO_MODEL || 'sora-2';
    const formData = new FormData();
    formData.append('model', model);
    formData.append('prompt', prompt);
    formData.append('seconds', process.env.OPENAI_VIDEO_SECONDS || '4');
    formData.append('size', process.env.OPENAI_VIDEO_SIZE || '1280x720');

    const response = await fetch(`${OPENAI_API_BASE}/videos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      data = { raw: text };
    }

    if (!response.ok) {
      throw Object.assign(new Error(data?.error?.message || text || 'OpenAI video request failed.'), {
        statusCode: response.status,
        code: data?.error?.code || 'openai_video_error',
      });
    }

    sendJson(res, 200, {
      id: data.id,
      status: data.status,
      progress: data.progress || 0,
      model: data.model || model,
    });
  } catch (error) {
    sendError(res, error);
  }
};
