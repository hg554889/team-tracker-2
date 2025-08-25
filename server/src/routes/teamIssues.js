import { Router } from 'express';
import { TeamIssue } from '../models/TeamIssue.js';
import { Team } from '../models/Team.js';
import { requireAuth } from '../middleware/auth.js';
import { Roles } from '../utils/roles.js';

const router = Router();

// 팀 이슈 목록 조회
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { teamId } = req.query;
    const userId = req.user.id;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // 팀 멤버인지 확인
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isMember = team.leader?.toString() === userId ||
                    team.members?.some(m => m.user?.toString() === userId);
    
    if (!isMember && req.user.role !== Roles.ADMIN && req.user.role !== Roles.EXECUTIVE) {
      return res.status(403).json({ error: 'Not authorized to view team issues' });
    }

    const issues = await TeamIssue.find({ team: teamId })
      .populate('reportedBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('resolvedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    next(error);
  }
});

// 팀 이슈 생성
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { teamId, title, description, severity, type, assignedTo, dueDate, tags } = req.body;
    const userId = req.user.id;

    if (!teamId || !title || !description) {
      return res.status(400).json({ error: 'Team ID, title, and description are required' });
    }

    // 팀 멤버인지 확인
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isMember = team.leader?.toString() === userId ||
                    team.members?.some(m => m.user?.toString() === userId);
    
    if (!isMember && req.user.role !== Roles.ADMIN && req.user.role !== Roles.EXECUTIVE) {
      return res.status(403).json({ error: 'Not authorized to create team issues' });
    }

    const issue = new TeamIssue({
      team: teamId,
      title,
      description,
      severity: severity || 'medium',
      type: type || 'other',
      reportedBy: userId,
      assignedTo: assignedTo || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tags || []
    });

    await issue.save();
    
    const populatedIssue = await TeamIssue.findById(issue._id)
      .populate('reportedBy', 'username email')
      .populate('assignedTo', 'username email');

    res.status(201).json(populatedIssue);
  } catch (error) {
    next(error);
  }
});

// 팀 이슈 수정
router.put('/:issueId', requireAuth, async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const issue = await TeamIssue.findById(issueId).populate('team');
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // 권한 확인 (이슈 작성자, 팀 리더, 또는 관리자)
    const team = issue.team;
    const canEdit = issue.reportedBy.toString() === userId ||
                   team.leader?.toString() === userId ||
                   team.members?.some(m => m.user?.toString() === userId && m.role === 'LEADER') ||
                   req.user.role === Roles.ADMIN ||
                   req.user.role === Roles.EXECUTIVE;

    if (!canEdit) {
      return res.status(403).json({ error: 'Not authorized to edit this issue' });
    }

    // 상태가 resolved로 변경되는 경우
    if (updates.status === 'resolved' && issue.status !== 'resolved') {
      updates.resolvedAt = new Date();
      updates.resolvedBy = userId;
    }

    Object.assign(issue, updates);
    await issue.save();

    const updatedIssue = await TeamIssue.findById(issue._id)
      .populate('reportedBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('resolvedBy', 'username email');

    res.json(updatedIssue);
  } catch (error) {
    next(error);
  }
});

// 팀 이슈 삭제
router.delete('/:issueId', requireAuth, async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const userId = req.user.id;

    const issue = await TeamIssue.findById(issueId).populate('team');
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // 권한 확인 (이슈 작성자, 팀 리더, 또는 관리자만)
    const team = issue.team;
    const canDelete = issue.reportedBy.toString() === userId ||
                     team.leader?.toString() === userId ||
                     team.members?.some(m => m.user?.toString() === userId && m.role === 'LEADER') ||
                     req.user.role === Roles.ADMIN ||
                     req.user.role === Roles.EXECUTIVE;

    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this issue' });
    }

    await TeamIssue.findByIdAndDelete(issueId);
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;