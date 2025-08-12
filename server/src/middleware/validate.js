export const validate = (schema) => (req, res, next) => {
  const data = { body: req.body, params: req.params, query: req.query };
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return res.status(400).json({ error: 'ValidationError', details: parsed.error.flatten() });
  }
  if (parsed.data.body) req.body = parsed.data.body;
  if (parsed.data.params) req.params = parsed.data.params;
  if (parsed.data.query) req.query = parsed.data.query;
  next();
};