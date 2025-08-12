import { Router } from 'express';
import { z } from 'zod';
import { Report } from '../models/Report.js';
import { Team } from '../models/Team.js';
import { validate } from '../middleware/validate.js';
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
  goals: z.string().default(''),
  issues: z.string().default(''),
  dueAt: dateLike.optional(),
  attachments: z.array(z.any()).optional(),
});

function toDateOrNull(v){ if(!v) return null; const d=new Date(v); return Number.isNaN(d.getTime())?null:d; }

// 생성/업서트
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error:'ValidationError', details:parsed.error.flatten() });
    const { teamId, weekOf, progress, goals, issues, dueAt, attachments } = parsed.data;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'TeamNotFound' });

    const { id: userId, role } = req.user;
    const isMember = (team.members || []).some(m => m?.user?.toString() === userId);
    if (role !== Roles.ADMIN && !isMember) return res.status(403).json({ error: 'Forbidden' });

    const weekDate = toDateOrNull(weekOf);
    const dueDate  = toDateOrNull(dueAt);
    if (!weekDate) return res.status(400).json({ error: 'InvalidWeekOf' });

    const filter = { team: teamId, weekOf: weekDate };
    const $setOnInsert = { team: teamId, weekOf: weekDate, author: userId }; // author는 최초만
    const $set = { progress, goals, issues, dueAt: dueDate || undefined };
    if (attachments) $set.attachments = attachments;

    const report = await Report.findOneAndUpdate(
      filter,
      { $set, $setOnInsert },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

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

// 팀별 목록 (권한 체크)
router.get('/team/:teamId', requireAuth, async (req, res, next) => {
  try {
    const teamId = req.params.teamId;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'TeamNotFound' });

    const { id: userId, role } = req.user;
    const isMember = (team.members || []).some(m => m?.user?.toString() === userId);
    if (role !== Roles.ADMIN && !isMember) return res.status(403).json({ error: 'Forbidden' });

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
    if (req.user.role === Roles.ADMIN) {
      if (teamId) allowedTeamIds = [teamId];
      else {
        const all = await Team.find({}, { _id: 1 });
        allowedTeamIds = all.map(t => t._id);
      }
    } else {
      const myTeams = await Team.find({ 'members.user': req.user.id }, { _id: 1 });
      const myIds = myTeams.map(t => String(t._id));
      if (teamId) {
        if (!myIds.includes(String(teamId))) return res.status(403).json({ error: 'Forbidden' });
        allowedTeamIds = [teamId];
      } else {
        allowedTeamIds = myTeams.map(t => t._id);
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

// 단건 조회 (댓글 작성자 이름 포함)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const r = await Report.findById(req.params.id).populate('comments.author', 'username').populate('team', 'name');
    if (!r) return res.status(404).json({ error: 'NotFound' });

    const team = await Team.findById(r.team._id);
    const { id: userId, role } = req.user;
    const isMember = (team?.members || []).some(m => m?.user?.toString() === userId);
    if (role !== Roles.ADMIN && !isMember) return res.status(403).json({ error: 'Forbidden' });

    res.json(r);
  } catch (e) { next(e); }
});

// 수정 (ADMIN 또는 작성자/리더)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const r = await Report.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'NotFound' });

    const team = await Team.findById(r.team);
    const { id: userId, role } = req.user;
    const isLeader = team?.leader?.toString() === userId;
    const isAuthor = r.author.toString() === userId;
    if (!(role === Roles.ADMIN || isLeader || isAuthor)) return res.status(403).json({ error: 'Forbidden' });

    const up = {};
    if (req.body.progress !== undefined) up.progress = Number(req.body.progress);
    if (req.body.goals !== undefined) up.goals = req.body.goals;
    if (req.body.issues !== undefined) up.issues = req.body.issues;
    if (req.body.dueAt) up.dueAt = new Date(req.body.dueAt);

    const updated = await Report.findByIdAndUpdate(req.params.id, up, { new: true });
    res.json(updated);
  } catch (e) { next(e); }
});

// ✅ 코멘트 작성 (안정화 버전)
router.post('/:id/comments', requireAuth, validate(commentCreateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const report = await Report.findById(id).populate({ path: 'team', select: 'members' });
    if (!report) return res.status(404).json({ error: 'ReportNotFound' });

    let isMember = false;
    if (req.user.role === Roles.ADMIN) {
      isMember = true;
    } else if (report.team && Array.isArray(report.team.members)) {
      isMember = report.team.members.some((m) => String(m.user) === String(userId));
    } else {
      const team = await Team.findById(report.team);
      isMember = (team?.members || []).some((m) => String(m.user) === String(userId));
    }
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

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

// ✅ 코멘트 목록 (안정화)
router.get('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id)
      .select('comments team')
      .populate('comments.author', 'username')  // user -> author
      .populate({ path: 'team', select: 'members' });

    if (!report) return res.status(404).json({ error: 'ReportNotFound' });

    // ADMIN or 팀 멤버만 열람 허용 (정책에 맞게 유지)
    if (req.user.role !== Roles.ADMIN) {
      const isMember = (report.team?.members || [])
        .some((m) => String(m.user) === String(req.user.id));
      if (!isMember) return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(report.comments || []);
  } catch (e) {
    console.error('[comments.get] ', e);
    next(e);
  }
});

export default router;
