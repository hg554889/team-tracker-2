import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireClubAccess } from '../middleware/clubAccess.js';
import { User } from '../models/User.js';
import { Roles } from '../utils/roles.js';
import { signJwt } from '../utils/jwt.js';
import { getSocketService } from '../services/socketService.js';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  const id = req.user.id;
  const user = await User.findById(id).select('-password');
  res.json(user);
});

router.put('/me', requireAuth, async (req, res) => {
  const me = await User.findById(req.user.id).select('role clubId username');
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  const update = {};
  if (req.body.username) update.username = req.body.username;

  // ✅ clubId 가드: 이미 있으면 일반 유저는 변경 불가
  if (req.body.clubId) {
    const isAdmin = me.role === Roles.ADMIN;
    if (!me.clubId || isAdmin) {
      update.clubId = req.body.clubId;   // 최초 설정 또는 ADMIN만 변경 허용
    }
    // else: 무시 (변경하지 않음)
  }

  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
  res.json(user);
});

// 목록: ADMIN은 전 동아리(필터 가능), EXECUTIVE는 자기 동아리만, 검색(q)
router.get('/', requireAuth, async (req, res) => {
  const { role, clubId: userClubId } = req.user;
  const { clubId, q } = req.query;

  let query = {};
  
  // Club access control
  if (role === Roles.ADMIN) {
    if (clubId) {
      query.clubId = clubId;
    }
    // ADMIN은 clubId 필터 없으면 모든 동아리 조회 가능
  } else if (role === Roles.EXECUTIVE) {
    // EXECUTIVE는 본인 동아리가 있을 때만 조회 가능
    if (!userClubId) {
      return res.status(403).json({ 
        error: 'Club not assigned',
        message: '동아리가 할당되지 않았습니다. 프로필에서 동아리를 선택해주세요.'
      });
    }
    query.clubId = userClubId; // 자신의 동아리만
    query.role = { $ne: Roles.ADMIN }; // ADMIN 계정 제외
  } else {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (q) {
    query.$or = [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ];
  }

  const users = await User.find(query).select('-password');
  const masked = users.map(u => {
    const doc = u.toObject();
    if (role === Roles.EXECUTIVE && u.role === Roles.EXECUTIVE) {
      doc.role = 'HIDDEN';
    }
    return doc;
  });

  res.json(masked);
});

router.put('/:id', requireAuth, async (req, res) => {
  const me = await User.findById(req.user.id).select('role');
  if (!me || me.role !== Roles.ADMIN) return res.status(403).json({ error: 'Forbidden' });
  const { role, clubId, username } = req.body;
  const update = {};
  if (role) update.role = role;
  if (clubId !== undefined) update.clubId = clubId;
  if (username) update.username = username;
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
  
  // 역할이나 동아리가 변경된 경우 변경된 사용자를 위한 새 JWT 토큰 발급
  let userToken = null;
  if (role || clubId !== undefined) {
    userToken = signJwt({
      id: user._id,
      role: user.role,
      clubId: user.clubId
    });

    // 소켓을 통해 해당 사용자에게 권한 변경 알림
    const socketService = getSocketService();
    if (socketService) {
      socketService.notifyRoleUpdate(user._id, userToken, user);
    }
  }
  
  res.json({ 
    user,
    message: '사용자 정보가 업데이트되었습니다.'
  });
});

// ✅ 내 비밀번호 변경 (현재 비번 확인 → 새 비번 저장)
router.put('/me/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'ValidationError', message: 'currentPassword, newPassword required' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'ValidationError', message: 'Password must be at least 8 characters' });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(401).json({ error: 'InvalidCredentials', message: 'Current password is incorrect' });

  user.password = newPassword; // pre('save')에서 해시됨
  await user.save();

  return res.json({ ok: true });
});

export default router;