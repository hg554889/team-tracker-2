import { Router } from 'express';
import { User, BCRYPT_MAX_BYTES } from '../models/User.js';
import { signJwt } from '../utils/jwt.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../validators/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const router = Router();

const isPasswordWithinLimit = (value) =>
  typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= BCRYPT_MAX_BYTES;

// Signup
router.post('/signup', validate(signupSchema), async (req, res, next) => {
  try {
    const { email, username, password, studentId, clubId } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!isPasswordWithinLimit(password)) {
      return res.status(422).json({ error: 'InvalidPasswordLength' });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ error: 'EmailInUse' });
    
    const studentExists = await User.findOne({ studentId });
    if (studentExists) return res.status(409).json({ error: 'StudentIdInUse' });
    
    const user = await User.create({ 
      email: normalizedEmail, 
      username: username.trim(), 
      password, 
      studentId,
      clubId,
      role: 'MEMBER',
      isApproved: false,
      approvalStatus: 'pending'
    });
    
    const token = signJwt({ 
      id: user.id, 
      role: user.role, 
      clubId: user.clubId 
    });
    
    res.json({ 
      token, 
      user: { 
        _id: user.id, 
        email: normalizedEmail, 
        username: username.trim(), 
        studentId,
        role: user.role, 
        clubId: user.clubId,
        isApproved: user.isApproved,
        approvalStatus: user.approvalStatus
      } 
    });
  } catch (e) { next(e); }
});

// Login
router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!isPasswordWithinLimit(password)) {
      return res.status(401).json({ error: 'InvalidCredentials' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'InvalidCredentials' });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'InvalidCredentials' });
    }
    
    const token = signJwt({ 
      id: user.id, 
      role: user.role, 
      clubId: user.clubId 
    });
    
    res.json({ 
      token, 
      user: { 
        _id: user.id, 
        email: user.email, 
        username: user.username, 
        studentId: user.studentId,
        role: user.role, 
        clubId: user.clubId,
        isApproved: user.isApproved,
        approvalStatus: user.approvalStatus
      } 
    });
  } catch (e) { next(e); }
});

router.get('/me', async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = header.split(' ')[1];
    const { verifyJwt } = await import('../utils/jwt.js');
    const payload = verifyJwt(token);
    
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: 'UserNotFound' });
    
    res.json({
      _id: user.id,
      email: user.email,
      username: user.username,
      studentId: user.studentId,
      role: user.role,
      clubId: user.clubId,
      isApproved: user.isApproved,
      approvalStatus: user.approvalStatus
    });
  } catch (e) {
    next(e);
  }
});

export default router;
