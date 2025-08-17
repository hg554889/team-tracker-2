import { User } from '../models/User.js';

export async function requireApproval(req, res, next) {
  try {
    const { id } = req.user;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(401).json({ error: 'UserNotFound' });
    }
    
    if (!user.isApproved || user.approvalStatus !== 'approved') {
      return res.status(403).json({ 
        error: 'ApprovalRequired',
        message: 'Account pending approval',
        approvalStatus: user.approvalStatus 
      });
    }
    
    next();
  } catch (e) {
    return res.status(500).json({ error: 'InternalServerError' });
  }
}