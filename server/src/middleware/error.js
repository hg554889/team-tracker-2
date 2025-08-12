export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  console.error('[ERR]', status, err.message || err);
  res.status(status).json({ error: err.name || 'ServerError', message: err.message || 'Unexpected error' });
}