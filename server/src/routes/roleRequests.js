import { Router } from 'express';
import { RoleRequest } from '../models/RoleRequest.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { Roles } from '../utils/roles.js';
import { signJwt } from '../utils/jwt.js';

const router = Router();

// Create a role request
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { id: userId, role: currentRole, clubId } = req.user;
    const { requestedRole, reason } = req.body;
    
    if (!requestedRole || !reason) {
      return res.status(400).json({ error: 'RequestedRole and reason are required' });
    }
    
    // Validate requested role
    const validRoles = Object.values(Roles);
    if (!validRoles.includes(requestedRole)) {
      return res.status(400).json({ error: 'Invalid role requested' });
    }
    
    // Check if user already has pending request
    const existingRequest = await RoleRequest.findOne({
      userId,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(409).json({ error: 'You already have a pending role request' });
    }
    
    // Don't allow requesting same or lower role
    const roleHierarchy = { MEMBER: 1, LEADER: 2, EXECUTIVE: 3, ADMIN: 4 };
    if (roleHierarchy[requestedRole] <= roleHierarchy[currentRole]) {
      return res.status(400).json({ error: 'Cannot request same or lower role' });
    }
    
    const roleRequest = await RoleRequest.create({
      userId,
      currentRole,
      requestedRole,
      reason,
      clubId
    });
    
    await roleRequest.populate('userId', 'email username studentId');
    
    res.status(201).json({ 
      message: 'Role request submitted successfully',
      request: roleRequest 
    });
  } catch (e) { 
    next(e); 
  }
});

// Get role requests (for admins/executives)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { role, clubId } = req.user;
    
    if (!([Roles.ADMIN, Roles.EXECUTIVE].includes(role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    let filter = { status: 'pending' };
    
    // Executive can only see requests from their club
    if (role === Roles.EXECUTIVE) {
      filter.clubId = clubId;
    }
    
    const requests = await RoleRequest.find(filter)
      .populate('userId', 'email username studentId')
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (e) { 
    next(e); 
  }
});

// Get user's own role requests
router.get('/my-requests', requireAuth, async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    
    const requests = await RoleRequest.find({ userId })
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (e) { 
    next(e); 
  }
});

// Process role request (approve/reject)
router.post('/:requestId/process', requireAuth, async (req, res, next) => {
  try {
    const { role, id: processedBy, clubId } = req.user;
    const { requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    
    if (!([Roles.ADMIN, Roles.EXECUTIVE].includes(role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const roleRequest = await RoleRequest.findById(requestId).populate('userId');
    if (!roleRequest) {
      return res.status(404).json({ error: 'Role request not found' });
    }
    
    if (roleRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }
    
    // Executive can only process requests from their club
    if (role === Roles.EXECUTIVE && roleRequest.clubId !== clubId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    roleRequest.status = action === 'approve' ? 'approved' : 'rejected';
    roleRequest.processedBy = processedBy;
    roleRequest.processedAt = new Date();
    
    await roleRequest.save();
    
    // If approved, update user's role and notify the user
    if (action === 'approve') {
      const updateData = { role: roleRequest.requestedRole };
      
      // EXECUTIVE 권한으로 승격하는 경우, 승인자와 같은 clubId 설정
      if (roleRequest.requestedRole === 'EXECUTIVE') {
        updateData.clubId = clubId; // 승인자의 clubId
      }
      
      await User.findByIdAndUpdate(roleRequest.userId._id, updateData, { new: true });
      
      // Notify the user about role change via socket (if available)
      // The user will need to refresh or re-login to get the updated token
      try {
        const { getSocketService } = await import('../services/socketService.js');
        const socketService = getSocketService();
        if (socketService) {
          socketService.notifyRoleChange(roleRequest.userId._id, {
            newRole: roleRequest.requestedRole,
            message: `역할이 ${roleRequest.requestedRole}로 승격되었습니다. 페이지를 새로고침해주세요.`
          });
        }
      } catch (error) {
        console.error('Failed to send role change notification:', error);
      }
    }
    
    res.json({ 
      message: `Role request ${action}d successfully`,
      request: roleRequest
    });
  } catch (e) { 
    next(e); 
  }
});

export default router;