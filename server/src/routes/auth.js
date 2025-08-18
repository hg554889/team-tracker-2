import { Router } from 'express';
import { User } from '../models/User.js';
import { signJwt } from '../utils/jwt.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../validators/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const router = Router();

// 회원가입 시
router.post('/signup', validate(signupSchema), async (req, res, next) => {
  try {
    const { email, username, password, studentId } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'EmailInUse' });
    
    const studentExists = await User.findOne({ studentId });
    if (studentExists) return res.status(409).json({ error: 'StudentIdInUse' });
    
    const user = await User.create({ 
      email, 
      username, 
      password, 
      studentId,
      role: 'MEMBER',
      isApproved: false,
      approvalStatus: 'pending'
    });
    
    // ✅ clubId 포함
    const token = signJwt({ 
      id: user.id, 
      role: user.role, 
      clubId: user.clubId 
    });
    
    res.json({ 
      token, 
      user: { 
        _id: user.id, 
        email, 
        username, 
        studentId,
        role: user.role, 
        clubId: user.clubId,
        isApproved: user.isApproved,
        approvalStatus: user.approvalStatus
      } 
    });
  } catch (e) { next(e); }
});

// 로그인 시
router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'InvalidCredentials' });
    }
    
    // ✅ clubId 포함
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