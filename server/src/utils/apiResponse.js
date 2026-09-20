// Ensures every successful response follows the same { success, message, data } shape
// documented in the README, so the frontend can rely on a consistent contract.
function sendSuccess(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess };
