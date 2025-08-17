import { Team } from '../models/Team.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { Roles } from '../utils/roles.js';

/**
 * 동아리별 접근 제어 미들웨어
 * ADMIN: 모든 동아리 접근 가능 (clubId 쿼리 파라미터로 필터링)
 * EXECUTIVE: 본인 동아리만 접근 가능
 * LEADER/MEMBER: 본인이 속한 팀의 동아리만 접근 가능
 */
export function requireClubAccess(req, res, next) {
  const { role, clubId: userClubId } = req.user;

  // ADMIN은 모든 접근 허용 (하지만 clubId 쿼리로 필터링)
  if (role === Roles.ADMIN) {
    return next();
  }

  // EXECUTIVE는 본인 동아리만
  if (role === Roles.EXECUTIVE) {
    req.allowedClubIds = [userClubId];
    return next();
  }

  // LEADER/MEMBER는 본인 동아리만
  req.allowedClubIds = [userClubId];
  next();
}

/**
 * 팀 접근 권한 확인
 */
export async function validateTeamAccess(req, res, next) {
  try {
    const { role, clubId: userClubId, id: userId } = req.user;
    const teamId = req.params.id || req.params.teamId;

    if (!teamId) {
      return next(); // 팀 ID가 없으면 다음으로
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // ADMIN은 모든 팀 접근 가능
    if (role === Roles.ADMIN) {
      return next();
    }

    // EXECUTIVE는 본인 동아리 팀만
    if (role === Roles.EXECUTIVE) {
      if (team.clubId !== userClubId) {
        return res.status(403).json({ error: 'Access denied to this club' });
      }
      return next();
    }

    // LEADER/MEMBER는 본인이 속한 팀만
    const isMember = team.members.some(m => String(m.user) === String(userId));
    const isLeader = String(team.leader) === String(userId);

    if (!isMember && !isLeader) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 보고서 접근 권한 확인
 */
export async function validateReportAccess(req, res, next) {
  try {
    const { role, clubId: userClubId, id: userId } = req.user;
    const reportId = req.params.id || req.params.reportId;

    if (!reportId) {
      return next();
    }

    const report = await Report.findById(reportId).populate('team');
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // ADMIN은 모든 보고서 접근 가능
    if (role === Roles.ADMIN) {
      return next();
    }

    // 동아리 체크
    if (report.clubId !== userClubId) {
      return res.status(403).json({ error: 'Access denied to this club' });
    }

    // EXECUTIVE는 본인 동아리 내 모든 보고서 접근 가능
    if (role === Roles.EXECUTIVE) {
      return next();
    }

    // LEADER/MEMBER는 본인 팀의 보고서만
    const team = report.team;
    const isMember = team.members.some(m => String(m.user) === String(userId));
    const isLeader = String(team.leader) === String(userId);

    if (!isMember && !isLeader) {
      return res.status(403).json({ error: 'Access denied to this report' });
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 사용자 접근 권한 확인 (프로필 등)
 */
export async function validateUserAccess(req, res, next) {
  try {
    const { role, clubId: userClubId, id: requesterId } = req.user;
    const targetUserId = req.params.id || req.params.userId;

    if (!targetUserId) {
      return next();
    }

    // 본인 정보는 항상 접근 가능
    if (String(targetUserId) === String(requesterId)) {
      return next();
    }

    // ADMIN은 모든 사용자 접근 가능
    if (role === Roles.ADMIN) {
      return next();
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // EXECUTIVE는 본인 동아리 사용자만
    if (role === Roles.EXECUTIVE) {
      if (targetUser.clubId !== userClubId) {
        return res.status(403).json({ error: 'Access denied to this user' });
      }
      return next();
    }

    // LEADER/MEMBER는 본인만 (이미 위에서 체크됨)
    return res.status(403).json({ error: 'Access denied' });

  } catch (error) {
    next(error);
  }
}