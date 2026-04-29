const {
  ensureMethod,
  openaiJson,
  sendError,
  sendJson,
} = require('./_utils');

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

    const data = await openaiJson(`/videos/${encodeURIComponent(id)}`, null, { method: 'GET' });
    sendJson(res, 200, {
      id: data.id,
      status: data.status,
      progress: data.progress || 0,
      error: data.error || null,
    });
  } catch (error) {
    sendError(res, error);
  }
};
