import { Router } from 'express';
import { Team } from '../models/Team.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { teamCreateSchema, teamMemberSchema } from '../validators/teams.js';
import { getPagination } from '../utils/pagination.js';

const router = Router();

router.post('/', requireAuth, validate(teamCreateSchema), async (req, res, next) => {
  try {
    const leaderId = req.user.id;
    const { name, type, description, clubId, goal, startAt, endAt } = req.body;
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

router.get('/', requireAuth, async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const q = {};
  const { type, status, clubId, scope, q: keyword } = req.query;
  if (type) q.type = type;
  if (status) q.status = status;
  if (clubId) q.clubId = clubId;
  if (scope === 'mine') q['members.user'] = req.user.id; // 내 팀만
  if (keyword) q.$or = [
    { name: { $regex: keyword, $options: 'i' } },
    { description: { $regex: keyword, $options: 'i' } }
  ];

  const [items, total] = await Promise.all([
    Team.find(q)
      .populate('leader', 'username')  // 리더 정보를 포함하도록 추가
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Team.countDocuments(q)
  ]);
  res.json({ items, page, limit, total });
});

router.get('/:id', requireAuth, async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('leader', 'username')
    .populate('members.user', 'username');
  if (!team) return res.status(404).json({ error: 'NotFound' });
  const obj = team.toObject();
  if (!Array.isArray(obj.members)) obj.members = [];
  res.json(obj);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const team = await Team.findByIdAndUpdate(id, update, { new: true });
  if (!team) return res.status(404).json({ error: 'TeamNotFound' });
  res.json(team);
});


router.post('/:id/members', requireAuth, validate(teamMemberSchema), async (req, res) => {
  const { id } = req.params; const { userId, role } = req.body;
  const team = await Team.findById(id);
  if (!team) return res.status(404).json({ error: 'NotFound' });
  const requesterId = req.user.id;
  if (team.leader.toString() !== requesterId) return res.status(403).json({ error: 'Forbidden' });
  const exists = team.members.find((m) => m.user?.toString() === userId);
  if (!exists) team.members.push({ user: userId, role: role ?? 'MEMBER' });
  else if (role) exists.role = role;
  await team.save();
  res.json(team);
});

router.delete('/:id/members/:userId', requireAuth, async (req, res) => {
  const { id, userId } = req.params;
  const team = await Team.findById(id);
  if (!team) return res.status(404).json({ error: 'NotFound' });
  const requesterId = req.user.id;
  if (team.leader.toString() !== requesterId) return res.status(403).json({ error: 'Forbidden' });
  team.members = (team.members || []).filter((m) => m.user?.toString() !== userId);
  await team.save();
  res.json(team);
});

export default router;