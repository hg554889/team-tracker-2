import { Router } from 'express';
import { TeamJoinRequest } from '../models/TeamJoinRequest.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClubAccess } from '../middleware/clubAccess.js';
import { Roles } from '../utils/roles.js';
import { getPagination } from '../utils/pagination.js';

const router = Router();

// Create a team join request
router.post('/', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const { teamId, message } = req.body;
    const { id: userId, clubId: userClubId } = req.user;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is in the same club as the team (ADMIN can join any team)
    if (req.user.role !== Roles.ADMIN && team.clubId !== userClubId) {
      return res.status(403).json({ error: 'Can only request to join teams in your club' });
    }

    // Check if user is already a member
    const isAlreadyMember = team.members.some(m => String(m.user) === String(userId));
    if (isAlreadyMember) {
      return res.status(400).json({ error: 'Already a team member' });
    }

    // Check if there's already a pending request
    const existingRequest = await TeamJoinRequest.findOne({
      userId,
      teamId,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Join request already pending' });
    }

    const joinRequest = await TeamJoinRequest.create({
      userId,
      teamId,
      message: message || '',
      clubId: team.clubId
    });

    const populatedRequest = await TeamJoinRequest.findById(joinRequest._id)
      .populate('userId', 'username email')
      .populate('teamId', 'name');

    res.status(201).json(populatedRequest);
  } catch (error) {
    next(error);
  }
});

// Get join requests for a team (team leaders, executives, admins)
router.get('/team/:teamId', requireAuth, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { page, limit, skip } = getPagination(req.query);
    const { id: userId, role, clubId: userClubId } = req.user;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check permissions: team leaders, executives in same club, or admins
    const isTeamLeader = String(team.leader) === String(userId) || 
                        team.members.some(m => String(m.user) === String(userId) && m.role === 'LEADER');
    const isExecutiveInSameClub = role === Roles.EXECUTIVE && team.clubId === userClubId;
    const hasAccess = role === Roles.ADMIN || isExecutiveInSameClub || isTeamLeader;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const query = { teamId, status: req.query.status || 'pending' };
    
    const [items, total] = await Promise.all([
      TeamJoinRequest.find(query)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TeamJoinRequest.countDocuments(query)
    ]);

    res.json({ items, page, limit, total });
  } catch (error) {
    next(error);
  }
});

// Get user's own join requests
router.get('/my-requests', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { id: userId } = req.user;

    const query = { userId };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [items, total] = await Promise.all([
      TeamJoinRequest.find(query)
        .populate('teamId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TeamJoinRequest.countDocuments(query)
    ]);

    res.json({ items, page, limit, total });
  } catch (error) {
    next(error);
  }
});

// Process join request (approve/reject)
router.patch('/:id/process', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const { id: userId, role, clubId: userClubId } = req.user;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }

    const joinRequest = await TeamJoinRequest.findById(id)
      .populate('teamId')
      .populate('userId', 'username email');

    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Join request already processed' });
    }

    const team = joinRequest.teamId;

    // Check permissions: team leaders, executives in same club, or admins
    const isTeamLeader = String(team.leader) === String(userId) || 
                        team.members.some(m => String(m.user) === String(userId) && m.role === 'LEADER');
    const isExecutiveInSameClub = role === Roles.EXECUTIVE && team.clubId === userClubId;
    const hasAccess = role === Roles.ADMIN || isExecutiveInSameClub || isTeamLeader;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update join request status
    joinRequest.status = action === 'approve' ? 'approved' : 'rejected';
    joinRequest.processedBy = userId;
    joinRequest.processedAt = new Date();
    await joinRequest.save();

    // If approved, add user to team
    if (action === 'approve') {
      // Check if user is not already a member (double check)
      const isAlreadyMember = team.members.some(m => String(m.user) === String(joinRequest.userId._id));
      
      if (!isAlreadyMember) {
        team.members.push({
          user: joinRequest.userId._id,
          role: 'MEMBER'
        });
        await team.save();
      }
    }

    const updatedRequest = await TeamJoinRequest.findById(id)
      .populate('userId', 'username email')
      .populate('teamId', 'name')
      .populate('processedBy', 'username');

    res.json({
      message: `Join request ${action}d successfully`,
      request: updatedRequest
    });
  } catch (error) {
    next(error);
  }
});

// Cancel join request (by the requester)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const joinRequest = await TeamJoinRequest.findById(id);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    // Only the requester can cancel their own request
    if (String(joinRequest.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Can only cancel your own requests' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending requests' });
    }

    await TeamJoinRequest.findByIdAndDelete(id);
    res.json({ message: 'Join request cancelled successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;