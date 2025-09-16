import { Router } from 'express';
import { z } from 'zod';
import { Report } from '../models/Report.js';
import { Team } from '../models/Team.js';
import { validate } from '../middleware/validate.js';
import { requireClubAccess, validateReportAccess } from '../middleware/clubAccess.js';
import { reportCreateSchema, commentCreateSchema } from '../validators/reports.js';
import { requireAuth } from '../middleware/auth.js';
import { Roles } from '../utils/roles.js';

const router = Router();

// Date.parse 가능한 문자열 허용
const dateLike = z.string().min(1).refine(v => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

const createBody = z.object({
  teamId: z.string().min(1),
  weekOf: dateLike,
  progress: z.coerce.number().min(0).max(100),
  // 새로운 보고서 형식
  goals: z.string().default(''), // 주간 목표 및 기간 (하위 호환)
  progressDetails: z.string().default(''), // 진행 내역
  achievements: z.string().default(''), // 주요 성과
  completedTasks: z.string().default(''), // 완료 업무
  incompleteTasks: z.string().default(''), // 미완료 업무
  issues: z.string().default(''), // 이슈 및 고민사항
  nextWeekPlans: z.string().default(''), // 다음주 계획
  dueAt: dateLike.optional(),
  attachments: z.array(z.any()).optional(),
  // 하위 호환성을 위한 기존 필드들
  shortTermGoals: z.string().default(''),
  actionPlans: z.string().default(''),
  milestones: z.string().default(''),
});

function toDateOrNull(v){ if(!v) return null; const d=new Date(v); return Number.isNaN(d.getTime())?null:d; }

// 생성/업서트
router.post('/', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error:'ValidationError', details:parsed.error.flatten() });
    const { teamId, weekOf, progress, goals, progressDetails, achievements, completedTasks, incompleteTasks, issues, nextWeekPlans, dueAt, attachments, shortTermGoals, actionPlans, milestones } = parsed.data;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'TeamNotFound' });

    const { id: userId, role, clubId: userClubId } = req.user;
    
    // 동아리 접근 권한 확인
    if (role !== Roles.ADMIN && team.clubId !== userClubId) {
      return res.status(403).json({ error: 'ClubAccessDenied' });
    }
    
    // 팀 멤버십 확인 (EXECUTIVE는 예외)
    const isMember = (team.members || []).some(m => m?.user?.toString() === userId);
    if (role !== Roles.ADMIN && role !== Roles.EXECUTIVE && !isMember) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const weekDate = toDateOrNull(weekOf);
    const dueDate  = toDateOrNull(dueAt);
    if (!weekDate) return res.status(400).json({ error: 'InvalidWeekOf' });

    // 항상 새로운 보고서 생성
    const report = new Report({
      team: teamId,
      author: userId,
      weekOf: weekDate,
      clubId: team.clubId,
      progress,
      goals,
      progressDetails,
      achievements,
      completedTasks,
      incompleteTasks,
      issues,
      nextWeekPlans,
      dueAt: dueDate || undefined,
      // 하위 호환성을 위한 기존 필드들
      shortTermGoals,
      actionPlans,
      milestones,
      ...(attachments && { attachments })
    });

    await report.save();

    res.status(201).json(report);
  } catch (e) { next(e); }
});

// (추가) 마감 임박 보고서
router.get('/due-soon', requireAuth, async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(14, Number(req.query.days || 3)));
    const scope = req.query.scope || 'mine'; // 'mine' | 'club' | 'global'
    const now = new Date();
    const until = new Date(Date.now() + days*24*3600*1000);

    let teamQuery = {};
    if (scope === 'global' && req.user.role === Roles.ADMIN) {
      if (req.query.clubId) teamQuery.clubId = req.query.clubId;
    } else if (scope === 'club' && (req.user.role === Roles.ADMIN || req.user.role === Roles.EXECUTIVE)) {
      teamQuery.clubId = req.user.clubId;
    } else {
      teamQuery = { 'members.user': req.user.id };
    }

    const teams = await Team.find(teamQuery);
    const teamIds = teams.map(t => t._id);

    const items = await Report.find({
      team: { $in: teamIds },
      dueAt: { $gte: now, $lte: until }
    }).sort({ dueAt: 1 });

    // 프론트 편의를 위한 매핑 (팀명/담당자)
    const teamMap = new Map(teams.map(t => [String(t._id), t]));
    const response = items.map(r => ({
      teamId: r.team,
      teamName: teamMap.get(String(r.team))?.name || '(팀)',
      dueAt: r.dueAt,
      assignee: '' // 필요 시 author populate
    }));

    res.json(response);
  } catch (e) { next(e); }
});

// 팀별 목록 (권한 체크 강화)
router.get('/team/:teamId', requireAuth, async (req, res, next) => {
  try {
    const teamId = req.params.teamId;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'TeamNotFound' });

    const { id: userId, role, clubId: userClubId } = req.user;
    
    // 권한 체크: ADMIN, EXECUTIVE(같은 동아리), 모든 LEADER/MEMBER
    let hasAccess = false;
    if (role === Roles.ADMIN) {
      hasAccess = true;
    } else if (role === Roles.EXECUTIVE && team.clubId === userClubId) {
      hasAccess = true;
    } else {
      // LEADER/MEMBER는 모든 팀 보고서 조회 가능
      hasAccess = true;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const items = await Report.find({ team: teamId }).sort({ weekOf: -1 });
    res.json(items);
  } catch (e) { next(e); }
});

// 전체/팀별 목록 (페이징)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, teamId, from, to } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));
    const skip = (p - 1) * l;

    let allowedTeamIds = [];
    const { role, clubId: userClubId, id: userId } = req.user;
    
    if (role === Roles.ADMIN) {
      if (teamId) allowedTeamIds = [teamId];
      else {
        const all = await Team.find({}, { _id: 1 });
        allowedTeamIds = all.map(t => t._id);
      }
    } else if (role === Roles.EXECUTIVE) {
      // EXECUTIVE는 본인 동아리 모든 팀
      const clubTeams = await Team.find({ clubId: userClubId }, { _id: 1 });
      if (teamId) {
        const requestedTeam = await Team.findById(teamId);
        if (requestedTeam && requestedTeam.clubId === userClubId) {
          allowedTeamIds = [teamId];
        } else {
          return res.status(403).json({ error: 'Forbidden' });
        }
      } else {
        allowedTeamIds = clubTeams.map(t => t._id);
      }
    } else {
      // LEADER/MEMBER는 모든 팀의 보고서 조회 가능
      if (teamId) {
        allowedTeamIds = [teamId];
      } else {
        const allTeams = await Team.find({}, { _id: 1 });
        allowedTeamIds = allTeams.map(t => t._id);
      }
    }

    const q = { team: { $in: allowedTeamIds } };
    if (from || to) {
      q.weekOf = {};
      if (from) q.weekOf.$gte = new Date(from);
      if (to) q.weekOf.$lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      Report.find(q).sort({ weekOf: -1 }).skip(skip).limit(l),
      Report.countDocuments(q),
    ]);

    res.json({ items, page: p, limit: l, total });
  } catch (e) { next(e); }
});

// 단건 조회 (댓글 작성자 이름 포함) - EXECUTIVE 권한 추가
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const r = await Report.findById(req.params.id)
      .populate('comments.author', 'username')
      .populate('team', 'name');
    
    if (!r) return res.status(404).json({ error: 'NotFound' });

    const { id: userId, role, clubId: userClubId } = req.user;

    // 권한 체크: ADMIN, EXECUTIVE(같은 동아리), 모든 LEADER/MEMBER
    let hasAccess = false;
    
    if (role === Roles.ADMIN) {
      hasAccess = true;
    } else if (role === Roles.EXECUTIVE && r.clubId === userClubId) {
      hasAccess = true;
    } else {
      // LEADER/MEMBER는 모든 보고서 조회 가능
      hasAccess = true;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(r);
  } catch (e) { 
    console.error('Report get error:', e);
    next(e); 
  }
});

// 수정 (ADMIN, EXECUTIVE, 작성자, 또는 리더)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const r = await Report.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'NotFound' });

    const team = await Team.findById(r.team);
    const { id: userId, role, clubId: userClubId } = req.user;
    
    const isLeader = team?.leader?.toString() === userId;
    const isAuthor = r.author.toString() === userId;
    const isExecutiveInSameClub = (role === Roles.EXECUTIVE && r.clubId === userClubId);
    
    if (!(role === Roles.ADMIN || isExecutiveInSameClub || isLeader || isAuthor)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const up = {};
    if (req.body.progress !== undefined) up.progress = Number(req.body.progress);
    if (req.body.goals !== undefined) up.goals = req.body.goals;
    if (req.body.progressDetails !== undefined) up.progressDetails = req.body.progressDetails;
    if (req.body.achievements !== undefined) up.achievements = req.body.achievements;
    if (req.body.completedTasks !== undefined) up.completedTasks = req.body.completedTasks;
    if (req.body.incompleteTasks !== undefined) up.incompleteTasks = req.body.incompleteTasks;
    if (req.body.issues !== undefined) up.issues = req.body.issues;
    if (req.body.nextWeekPlans !== undefined) up.nextWeekPlans = req.body.nextWeekPlans;
    // 하위 호환성을 위한 기존 필드들
    if (req.body.shortTermGoals !== undefined) up.shortTermGoals = req.body.shortTermGoals;
    if (req.body.actionPlans !== undefined) up.actionPlans = req.body.actionPlans;
    if (req.body.milestones !== undefined) up.milestones = req.body.milestones;
    if (req.body.dueAt) up.dueAt = new Date(req.body.dueAt);

    const updated = await Report.findByIdAndUpdate(req.params.id, up, { new: true });
    res.json(updated);
  } catch (e) { 
    console.error('Report update error:', e);
    next(e); 
  }
});

// 코멘트 작성 (EXECUTIVE 권한 추가)
router.post('/:id/comments', requireAuth, validate(commentCreateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const { id: userId, role, clubId: userClubId } = req.user;

    const report = await Report.findById(id).populate({ path: 'team', select: 'members' });
    if (!report) return res.status(404).json({ error: 'ReportNotFound' });

    let canComment = false;
    
    // 권한 체크: ADMIN, EXECUTIVE(같은 동아리), 모든 LEADER/MEMBER
    if (role === Roles.ADMIN) {
      canComment = true;
    } else if (role === Roles.EXECUTIVE && report.clubId === userClubId) {
      canComment = true;
    } else {
      // LEADER/MEMBER는 모든 보고서에 코멘트 가능
      canComment = true;
    }
    
    if (!canComment) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // author 필드 사용
    report.comments.push({ author: userId, text, createdAt: new Date() });
    await report.save();

    // populate 수정
    const populated = await Report.findById(report._id)
      .select('comments')
      .populate('comments.author', 'username');
    const created = populated.comments[populated.comments.length - 1];

    res.status(201).json(created);
  } catch (e) {
    console.error('[comments.post] ', e);
    next(e);
  }
});

// 코멘트 목록 (EXECUTIVE 권한 추가)
router.get('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId, role, clubId: userClubId } = req.user;
    
    const report = await Report.findById(id)
      .select('comments team clubId')
      .populate('comments.author', 'username')
      .populate({ path: 'team', select: 'members' });

    if (!report) return res.status(404).json({ error: 'ReportNotFound' });

    let canViewComments = false;
    
    // 권한 체크: ADMIN, EXECUTIVE(같은 동아리), 모든 LEADER/MEMBER
    if (role === Roles.ADMIN) {
      canViewComments = true;
    } else if (role === Roles.EXECUTIVE && report.clubId === userClubId) {
      canViewComments = true;
    } else {
      // LEADER/MEMBER는 모든 보고서 코멘트 조회 가능
      canViewComments = true;
    }
    
    if (!canViewComments) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(report.comments || []);
  } catch (e) {
    console.error('[comments.get] ', e);
    next(e);
  }
});

// 삭제 (ADMIN, EXECUTIVE, 작성자, 또는 리더)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const r = await Report.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'NotFound' });

    const team = await Team.findById(r.team);
    const { id: userId, role, clubId: userClubId } = req.user;
    
    const isLeader = team?.leader?.toString() === userId;
    const isAuthor = r.author.toString() === userId;
    const isExecutiveInSameClub = (role === Roles.EXECUTIVE && r.clubId === userClubId);
    
    if (!(role === Roles.ADMIN || isExecutiveInSameClub || isLeader || isAuthor)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (e) { 
    console.error('Report delete error:', e);
    next(e); 
  }
});

export default router;
