import { verifyJwt } from '../utils/jwt.js';

export function requireAuth(req, res, next){
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = header.split(' ')[1];
    const payload = verifyJwt(token); // { id, role }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}