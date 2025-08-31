import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Team } from '../models/Team.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const INVITES = new Map(); // dev용 메모리 저장 (prod는 컬렉션 권장)

// 초대 링크 생성 (리더만)
router.post('/create', requireAuth, async (req, res) => {
  const { teamId, role = 'MEMBER', expiresInMinutes = 60 } = req.body;
  const team = await Team.findById(teamId);
  if (!team) return res.status(404).json({ error: 'TeamNotFound' });
  const requester = req.user.id;
  const isLeader = team.leader && team.leader.toString() === requester;
  if (!isLeader) return res.status(403).json({ error: 'Forbidden' });
  const code = nanoid(12);
  const exp = Date.now() + expiresInMinutes * 60 * 1000;
  INVITES.set(code, { teamId, role, exp });
  res.json({ code });
});

// 초대 코드 검증
router.get('/:code', async (req, res) => {
  const it = INVITES.get(req.params.code);
  if (!it || Date.now() > it.exp) return res.status(404).json({ error: 'InvalidInvite' });
  
  // 팀 정보를 포함하여 반환
  const team = await Team.findById(it.teamId);
  if (!team) return res.status(404).json({ error: 'TeamNotFound' });
  
  res.json({ 
    teamId: it.teamId, 
    teamName: team.name,
    teamType: team.type,
    role: it.role, 
    exp: it.exp 
  });
});

// 초대 수락 (로그인 필요)
router.post('/:code/accept', requireAuth, async (req, res) => {
  const it = INVITES.get(req.params.code);
  if (!it || Date.now() > it.exp) return res.status(404).json({ error: 'InvalidInvite' });
  const team = await Team.findById(it.teamId);
  if (!team) return res.status(404).json({ error: 'TeamNotFound' });
  const userId = req.user.id;
  const exists = (team.members||[]).some(m => m?.user?.toString() === userId);
  if (!exists) team.members.push({ user: userId, role: it.role });
  await team.save();
  INVITES.delete(req.params.code);
  res.json({ ok: true, teamId: team.id });
});

export default router;