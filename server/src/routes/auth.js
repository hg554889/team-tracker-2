import { Router } from 'express';
import { User } from '../models/User.js';
import { signJwt } from '../utils/jwt.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../validators/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/signup', validate(signupSchema), async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'EmailInUse' });
    const user = await User.create({ email, username, password, role: 'MEMBER' });
    const token = signJwt({ id: user.id, role: user.role });
    res.json({ token, user: { _id: user.id, email, username, role: user.role, clubId: user.clubId } });
  } catch (e) { next(e); }
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'InvalidCredentials' });
    }
    const token = signJwt({ id: user.id, role: user.role });
    res.json({ token, user: { _id: user.id, email: user.email, username: user.username, role: user.role, clubId: user.clubId } });
  } catch (e) { next(e); }
});

export default router;