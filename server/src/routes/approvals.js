import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateUserInfoSchema } from '../validators/auth.js';
import { Roles } from '../utils/roles.js';

const router = Router();

router.get('/pending', requireAuth, async (req, res, next) => {
  try {
    const { role, clubId } = req.user;
    
    if (!([Roles.ADMIN, Roles.EXECUTIVE].includes(role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    let filter = { approvalStatus: 'pending' };
    
    if (role === Roles.EXECUTIVE) {
      filter.clubId = clubId;
    }
    
    const pendingUsers = await User.find(filter)
      .select('email username studentId clubId createdAt')
      .sort({ createdAt: -1 });
    
    res.json({ users: pendingUsers });
  } catch (e) { 
    next(e); 
  }
});

router.post('/:userId/approve', requireAuth, async (req, res, next) => {
  try {
    const { role, id: approverId } = req.user;
    const { userId } = req.params;
    
    if (!([Roles.ADMIN, Roles.EXECUTIVE].includes(role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'UserNotFound' });
    }
    
    if (role === Roles.EXECUTIVE && user.clubId !== req.user.clubId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    user.approvalStatus = 'approved';
    user.isApproved = true;
    user.approvedBy = approverId;
    user.approvedAt = new Date();
    
    await user.save();
    
    res.json({ message: 'User approved successfully' });
  } catch (e) { 
    next(e); 
  }
});

router.post('/:userId/reject', requireAuth, async (req, res, next) => {
  try {
    const { role } = req.user;
    const { userId } = req.params;
    
    if (!([Roles.ADMIN, Roles.EXECUTIVE].includes(role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'UserNotFound' });
    }
    
    if (role === Roles.EXECUTIVE && user.clubId !== req.user.clubId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    user.approvalStatus = 'rejected';
    user.isApproved = false;
    
    await user.save();
    
    res.json({ message: 'User rejected successfully' });
  } catch (e) { 
    next(e); 
  }
});

router.put('/update-info', requireAuth, validate(updateUserInfoSchema), async (req, res, next) => {
  try {
    const { id } = req.user;
    const { username, studentId } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'UserNotFound' });
    }
    
    if (user.approvalStatus !== 'pending') {
      return res.status(400).json({ error: 'CannotUpdateApprovedUser' });
    }
    
    if (studentId && studentId !== user.studentId) {
      const studentExists = await User.findOne({ studentId, _id: { $ne: id } });
      if (studentExists) {
        return res.status(409).json({ error: 'StudentIdInUse' });
      }
      user.studentId = studentId;
    }
    
    if (username) {
      user.username = username;
    }
    
    await user.save();
    
    res.json({ 
      message: 'User info updated successfully',
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
  } catch (e) { 
    next(e); 
  }
});

export default router;