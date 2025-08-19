import { Team } from '../models/Team.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { Roles } from '../utils/roles.js';

/**
 * 안전한 clubId 비교 함수
 */
function isSameClub(clubId1, clubId2) {
  if (!clubId1 || !clubId2) return false;
  return String(clubId1) === String(clubId2);
}

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

  // EXECUTIVE/LEADER/MEMBER는 본인 동아리만
  if (!userClubId) {
    return res.status(403).json({ 
      error: 'Club not assigned',
      details: 'User has no club assigned'
    });
  }

  req.allowedClubIds = [userClubId];
  next();
}

/**
 * 팀 접근 권한 확인
 * ADMIN: 모든 팀 접근 가능
 * EXECUTIVE: 본인 동아리의 모든 팀 접근 가능 (멤버십 불필요)
 * LEADER/MEMBER: 모든 팀 정보 조회 가능 (단, 전용 기능은 본인 팀만)
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

    // EXECUTIVE는 본인 동아리 팀만 (멤버십 체크 불필요)
    if (role === Roles.EXECUTIVE) {
      if (!isSameClub(team.clubId, userClubId)) {
        return res.status(403).json({ 
          error: 'Access denied to this club',
          details: `Team club: ${team.clubId}, User club: ${userClubId}`
        });
      }
      return next(); // EXECUTIVE는 동아리 내 모든 팀 접근 가능
    }

    // LEADER/MEMBER는 모든 팀 정보 조회 가능 (GET 요청만)
    // 단, 수정/삭제/멤버 관리는 본인 팀만 가능
    const isMember = team.members?.some(m => String(m.user) === String(userId));
    const isLeader = String(team.leader) === String(userId);
    
    // GET 요청(조회)는 모든 팀에 대해 허용
    if (req.method === 'GET') {
      req.isTeamMember = isMember || isLeader;
      return next();
    }
    
    // POST/PUT/DELETE 등 수정 요청은 본인 팀만 허용
    if (!isMember && !isLeader) {
      return res.status(403).json({ 
        error: 'Access denied to modify this team',
        details: `User ${userId} is not a member or leader of team ${teamId}`
      });
    }

    next();
  } catch (error) {
    console.error('validateTeamAccess error:', error);
    next(error);
  }
}

/**
 * 보고서 접근 권한 확인
 * ADMIN: 모든 보고서 접근 가능
 * EXECUTIVE: 본인 동아리 내 모든 보고서 접근 가능
 * LEADER/MEMBER: 모든 보고서 조회 가능 (단, 수정/삭제는 본인 팀만)
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

    // EXECUTIVE는 본인 동아리 내 모든 보고서 접근 가능
    if (role === Roles.EXECUTIVE) {
      if (!isSameClub(report.clubId, userClubId)) {
        return res.status(403).json({ 
          error: 'Access denied to this club',
          details: `Report club: ${report.clubId}, User club: ${userClubId}`
        });
      }
      return next();
    }

    // LEADER/MEMBER는 모든 보고서 조회 가능 (GET 요청만)
    // 단, 수정/삭제는 본인 팀만 가능
    const team = report.team;
    if (!team) {
      return res.status(403).json({ 
        error: 'Team not found for this report',
        details: `Report ${reportId} has no associated team`
      });
    }

    const isMember = team.members?.some(m => String(m.user) === String(userId));
    const isLeader = String(team.leader) === String(userId);
    
    // GET 요청(조회)는 모든 보고서에 대해 허용
    if (req.method === 'GET') {
      req.isReportTeamMember = isMember || isLeader;
      return next();
    }
    
    // POST/PUT/DELETE 등 수정 요청은 본인 팀만 허용
    if (!isMember && !isLeader) {
      return res.status(403).json({ 
        error: 'Access denied to modify this report',
        details: `User ${userId} is not a member or leader of team ${team._id}`
      });
    }

    next();
  } catch (error) {
    console.error('validateReportAccess error:', error);
    next(error);
  }
}

/**
 * 사용자 접근 권한 확인 (프로필 등)
 * ADMIN: 모든 사용자 접근 가능
 * EXECUTIVE: 본인 동아리 사용자만 접근 가능
 * LEADER/MEMBER: 본인만 접근 가능
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
      if (!isSameClub(targetUser.clubId, userClubId)) {
        return res.status(403).json({ 
          error: 'Access denied to this user',
          details: `Target user club: ${targetUser.clubId}, User club: ${userClubId}`
        });
      }
      return next();
    }

    // LEADER/MEMBER는 본인만
    return res.status(403).json({ 
      error: 'Access denied',
      details: 'Only admins and executives can access other users'
    });

  } catch (error) {
    console.error('validateUserAccess error:', error);
    next(error);
  }
}