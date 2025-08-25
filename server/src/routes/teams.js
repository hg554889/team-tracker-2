import { Router } from 'express';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
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
  if (keyword) {
    // 멤버 이름으로 검색하기 위해 먼저 해당 이름을 가진 사용자 찾기
    const users = await User.find({
      username: { $regex: keyword, $options: 'i' }
    }).select('_id');
    const userIds = users.map(u => u._id);
    
    q.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { 'members.user': { $in: userIds } },  // 멤버 이름으로 검색
      { leader: { $in: userIds } }  // 리더 이름으로 검색
    ];
  }

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

// 팀 멤버 역할 변경 (LEADER <-> MEMBER)
router.patch('/:id/change-role', requireAuth, validateTeamAccess, async (req, res, next) => {
  try {
    const { id: teamId } = req.params;
    const { targetUserId, newRole } = req.body;
    const { id: requesterId, role: requesterRole } = req.user;

    if (!targetUserId || !['LEADER', 'MEMBER'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid target user or role' });
    }

    const team = await Team.findById(teamId).populate('members.user', 'username email');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // 권한 체크: ADMIN, EXECUTIVE(같은 동아리), 팀 LEADER만 가능
    const isTeamLeader = String(team.leader) === String(requesterId);
    const hasAdminAccess = ['ADMIN', 'EXECUTIVE'].includes(requesterRole);
    
    if (!hasAdminAccess && !isTeamLeader) {
      return res.status(403).json({ error: 'Only team leaders or admins can change member roles' });
    }

    // 대상 멤버 찾기
    const targetMember = team.members.find(m => String(m.user._id) === String(targetUserId));
    if (!targetMember) {
      return res.status(404).json({ error: 'Target user is not a member of this team' });
    }

    // 자기 자신의 리더 역할을 해제하는 경우, 다른 리더가 있는지 확인
    if (String(targetUserId) === String(requesterId) && 
        String(team.leader) === String(requesterId) && 
        newRole === 'MEMBER') {
      
      // 다른 LEADER 역할의 멤버가 있는지 확인
      const otherLeaders = team.members.filter(m => 
        m.role === 'LEADER' && String(m.user._id) !== String(targetUserId)
      );

      if (otherLeaders.length === 0) {
        return res.status(400).json({ 
          error: 'Cannot demote yourself when you are the only leader. Please assign another leader first.' 
        });
      }

      // 다른 리더 중 첫 번째를 팀 리더로 승격
      team.leader = otherLeaders[0].user._id;
    }

    // MEMBER를 LEADER로 승격하는 경우
    if (newRole === 'LEADER') {
      // 기존 팀 리더를 MEMBER로 강등
      if (String(team.leader) !== String(targetUserId)) {
        const currentLeaderMember = team.members.find(m => String(m.user._id) === String(team.leader));
        if (currentLeaderMember) {
          currentLeaderMember.role = 'MEMBER';
        }
        
        // 새로운 팀 리더 설정
        team.leader = targetUserId;
      }
    }

    // 멤버 역할 업데이트
    targetMember.role = newRole;

    await team.save();

    // 응답 데이터 준비
    const updatedTeam = await Team.findById(teamId)
      .populate('leader', 'username email')
      .populate('members.user', 'username email');

    res.json({
      message: 'Role changed successfully',
      team: updatedTeam
    });

  } catch (error) {
    next(error);
  }
});

export default router;