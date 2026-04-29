const {
  cleanString,
  ensureMethod,
  openaiJson,
  readJson,
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

    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
    const data = await openaiJson('/images/generations', {
      model,
      prompt,
      n: 1,
      size: process.env.OPENAI_IMAGE_SIZE || '1536x1024',
      output_format: 'png',
    });

    const image = data?.data?.[0];
    const imageUrl = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url;

    if (!imageUrl) {
      throw Object.assign(new Error('OpenAI did not return an image.'), { statusCode: 502 });
    }

    sendJson(res, 200, {
      image: imageUrl,
      model,
    });
  } catch (error) {
    sendError(res, error);
  }
};
