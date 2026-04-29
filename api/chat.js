const {
  cleanString,
  ensureMethod,
  extractResponseText,
  openaiJson,
  readJson,
  sendError,
  sendJson,
} = require('./_utils');

module.exports = async function handler(req, res) {
  if (!ensureMethod(req, res, 'POST')) return;

  try {
    const body = await readJson(req);
    const question = cleanString(body.question, 1000);

    if (!question) {
      sendJson(res, 400, {
        error: 'question_required',
        message: 'Question is required.',
      });
      return;
    }

    const model = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';
    const data = await openaiJson('/responses', {
      model,
      instructions: 'Ты краткий помощник по теме smart home и IoT. Отвечай на русском простыми словами, максимум 4 предложения.',
      input: question,
      max_output_tokens: 500,
    });

    sendJson(res, 200, {
      answer: extractResponseText(data) || 'Не получилось сформировать ответ.',
      model: data.model || model,
    });
  } catch (error) {
    sendError(res, error);
  }
};
