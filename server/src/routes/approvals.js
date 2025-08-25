import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateUserInfoSchema } from '../validators/auth.js';
import { Roles } from '../utils/roles.js';
import { getSocketService } from '../services/socketService.js';

const router = Router();

router.get('/pending', requireAuth, async (req, res, next) => {
  try {
    const { role, clubId, id } = req.user;
    
    console.log('[DEBUG] Approvals API - User role:', role, 'clubId:', clubId, 'userId:', id);
    
    if (!([Roles.ADMIN, Roles.EXECUTIVE].includes(role))) {
      console.log('[DEBUG] Access denied - insufficient role');
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    let filter = { approvalStatus: 'pending' };
    
    if (role === Roles.EXECUTIVE) {
      filter.clubId = clubId;
      console.log('[DEBUG] EXECUTIVE filter applied - only showing clubId:', clubId);
    } else {
      console.log('[DEBUG] ADMIN access - showing all pending users');
    }
    
    console.log('[DEBUG] Final filter:', JSON.stringify(filter));
    
    // 모든 pending 사용자를 먼저 찾아보자
    const allPendingUsers = await User.find({ approvalStatus: 'pending' })
      .select('email username studentId clubId createdAt')
      .sort({ createdAt: -1 });
    
    console.log('[DEBUG] Total pending users in system:', allPendingUsers.length);
    allPendingUsers.forEach(u => console.log(`  - ${u.username} (${u.email}) - clubId: ${u.clubId}`));
    
    const pendingUsers = await User.find(filter)
      .select('email username studentId clubId createdAt')
      .sort({ createdAt: -1 });
    
    console.log('[DEBUG] Filtered pending users for this role:', pendingUsers.length);
    pendingUsers.forEach(u => console.log(`  - ${u.username} (${u.email}) - clubId: ${u.clubId}`));
    
    res.json({ users: pendingUsers });
  } catch (e) { 
    console.log('[DEBUG] Error in approvals API:', e);
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
    
    // 실시간으로 사용자에게 승인 알림
    try {
      const socketService = getSocketService();
      if (socketService) {
        socketService.notifyUserApproval(userId, {
          approved: true,
          approvedAt: user.approvedAt,
          message: '회원가입이 승인되었습니다! 모든 기능을 사용하실 수 있습니다.'
        });
      }
    } catch (error) {
      console.error('Failed to send approval notification:', error);
    }
    
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