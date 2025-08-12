import { User } from '../models/User.js';

// 최신 역할/클럽을 DB에서 매 요청마다 반영해 req.user에 덮어쓰기
export async function enrichRole(req, _res, next){
  try {
    if (!req.user?.id) return next();
    const me = await User.findById(req.user.id).select('role clubId');
    if (me) {
      req.user.role = me.role;
      req.user.clubId = me.clubId;
    }
    next();
  } catch (e) { next(e); }
}