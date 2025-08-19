import { Router } from 'express';
import { Team } from '../models/Team.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireClubAccess, validateTeamAccess } from '../middleware/clubAccess.js';
import { teamCreateSchema, teamMemberSchema } from '../validators/teams.js';
import { getPagination } from '../utils/pagination.js';
import { Roles } from '../utils/roles.js';

const router = Router();

router.post('/', requireAuth, requireClubAccess, validate(teamCreateSchema), async (req, res, next) => {
  try {
    const leaderId = req.user.id;
    const userClubId = req.user.clubId;
    const { name, type, description, goal, startAt, endAt } = req.body;
    
    // clubId는 요청자의 clubId로 강제 설정 (ADMIN 제외)
    const clubId = req.user.role === Roles.ADMIN ? req.body.clubId || userClubId : userClubId;
    
    const team = await Team.create({
      name, type, description, clubId, goal,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      leader: leaderId,
      members: [{ user: leaderId, role: 'LEADER' }]
    });
    res.status(201).json(team);
  } catch (e) { next(e); }
});

router.get('/', requireAuth, requireClubAccess, async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const q = {};
  const { type, status, scope, q: keyword } = req.query;
  const { role, clubId: userClubId } = req.user;
  
  if (type) q.type = type;
  if (status) q.status = status;
  if (scope === 'mine') q['members.user'] = req.user.id; // 내 팀만
  if (keyword) q.$or = [
    { name: { $regex: keyword, $options: 'i' } },
    { description: { $regex: keyword, $options: 'i' } }
  ];

  // 동아리별 필터링
  if (role === Roles.ADMIN) {
    // ADMIN은 clubId 쿼리 파라미터로 필터링 가능
    const requestedClubId = req.query.clubId;
    if (requestedClubId) {
      q.clubId = requestedClubId;
    }
  } else {
    // 다른 역할은 본인 동아리만
    q.clubId = userClubId;
  }

  const [items, total] = await Promise.all([
    Team.find(q)
      .populate('leader', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Team.countDocuments(q)
  ]);

  // 각 팀에 사용자의 멤버십 정보 추가
  const itemsWithMembership = items.map(team => {
    const teamObj = team.toObject();
    const userId = req.user.id;
    
    // 사용자가 팀 리더인지 확인
    const isLeader = String(team.leader._id) === String(userId);
    
    // 사용자가 팀 멤버인지 확인
    const memberInfo = team.members?.find(m => String(m.user) === String(userId));
    const isMember = !!memberInfo;
    
    // 멤버십 정보 추가
    teamObj.userMembership = {
      isMember: isMember || isLeader,
      isLeader: isLeader,
      role: isLeader ? 'LEADER' : (memberInfo?.role || null)
    };
    
    return teamObj;
  });

  res.json({ items: itemsWithMembership, page, limit, total });
});

router.get('/:id', requireAuth, validateTeamAccess, async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('leader', 'username')
    .populate('members.user', 'username');
  if (!team) return res.status(404).json({ error: 'NotFound' });
  const obj = team.toObject();
  if (!Array.isArray(obj.members)) obj.members = [];
  res.json(obj);
});

router.put('/:id', requireAuth, validateTeamAccess, async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  
  // clubId 변경 방지 (ADMIN 제외)
  if (req.user.role !== Roles.ADMIN && update.clubId) {
    delete update.clubId;
  }
  
  const team = await Team.findByIdAndUpdate(id, update, { new: true });
  if (!team) return res.status(404).json({ error: 'TeamNotFound' });
  res.json(team);
});

router.post('/:id/members', requireAuth, validateTeamAccess, validate(teamMemberSchema), async (req, res, next) => {
  try {
    const { id } = req.params; 
    const { email, role } = req.body;
    
    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ error: 'TeamNotFound' });
    
    const requesterId = req.user.id;
    const isLeader = team.leader.toString() === requesterId;
    const isExecutiveOrAdmin = [Roles.EXECUTIVE, Roles.ADMIN].includes(req.user.role);
    
    if (!isLeader && !isExecutiveOrAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // 이메일로 사용자 찾기
    const { User } = await import('../models/User.js');
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    
    if (!targetUser) {
      return res.status(404).json({ 
        error: 'UserNotFound', 
        message: '해당 이메일을 가진 사용자를 찾을 수 없습니다.' 
      });
    }

    if (!targetUser.isApproved) {
      return res.status(400).json({ 
        error: 'UserNotApproved', 
        message: '아직 승인되지 않은 사용자입니다.' 
      });
    }

    // 동일한 동아리 체크 (ADMIN 제외)
    if (req.user.role !== Roles.ADMIN && targetUser.clubId !== req.user.clubId) {
      return res.status(400).json({ 
        error: 'DifferentClub', 
        message: '같은 동아리의 사용자만 초대할 수 있습니다.' 
      });
    }
    
    // 이미 멤버인지 확인
    const exists = team.members.find((m) => m.user?.toString() === targetUser._id.toString());
    const isLeaderAlready = team.leader.toString() === targetUser._id.toString();
    
    if (isLeaderAlready) {
      return res.status(400).json({ 
        error: 'AlreadyLeader', 
        message: '이미 팀 리더입니다.' 
      });
    }
    
    if (!exists) {
      team.members.push({ user: targetUser._id, role: role ?? 'MEMBER' });
    } else if (role) {
      exists.role = role;
    } else {
      return res.status(400).json({ 
        error: 'AlreadyMember', 
        message: '이미 팀 멤버입니다.' 
      });
    }
    
    await team.save();
    
    // 응답할 때는 사용자 정보도 함께 populate
    const updatedTeam = await Team.findById(id)
      .populate('leader', 'username email')
      .populate('members.user', 'username email');
    
    res.json(updatedTeam);
  } catch (e) { 
    next(e); 
  }
});

router.delete('/:id/members/:userId', requireAuth, validateTeamAccess, async (req, res) => {
  const { id, userId } = req.params;
  const team = await Team.findById(id);
  if (!team) return res.status(404).json({ error: 'NotFound' });
  
  const requesterId = req.user.id;
  const isLeader = team.leader.toString() === requesterId;
  const isExecutiveOrAdmin = [Roles.EXECUTIVE, Roles.ADMIN].includes(req.user.role);
  
  if (!isLeader && !isExecutiveOrAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  team.members = (team.members || []).filter((m) => m.user?.toString() !== userId);
  await team.save();
  res.json(team);
});

export default router;