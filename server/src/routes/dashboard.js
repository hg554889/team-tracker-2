import { Router } from 'express';
import { Report } from '../models/Report.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { RoleRequest } from '../models/RoleRequest.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClubAccess } from '../middleware/clubAccess.js';
import { Roles } from '../utils/roles.js';

const router = Router();

/**
 * KPI + DueSoon(요약) + myTeamsProgress(간단)
 * ADMIN: clubId 쿼리로 특정 동아리 필터 가능
 * EXECUTIVE: 자신의 clubId로 제한
 * LEADER/MEMBER: 본인 팀들만
 */
router.get('/summary', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const role = req.user.role;
    const meId = req.user.id;
    const clubId = req.user.clubId;
    const clubIdParam = req.query.clubId;

    let teams = [];
    let scope = 'MY';
    
    // 권한별 팀 조회
    if (role === Roles.ADMIN) {
      teams = await Team.find(clubIdParam ? { clubId: clubIdParam } : {});
      scope = clubIdParam ? 'CLUB' : 'GLOBAL';
    } else if (role === Roles.EXECUTIVE) {
      teams = await Team.find({ clubId });
      scope = 'CLUB';
    } else {
      teams = await Team.find({ 'members.user': meId });
      scope = 'MY';
    }

    const teamIds = teams.map(t => t._id);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // 기본 통계 계산
    const reportsThisWeek = await Report.find({ 
      team: { $in: teamIds }, 
      weekOf: { $gte: startOfWeek } 
    }).populate('author', 'username email');

    const avgByTeam = await Report.aggregate([
      { $match: { team: { $in: teamIds } } },
      { $group: { _id: '$team', avgProgress: { $avg: '$progress' } } }
    ]);

    const dueSoon = await Report.find({
      team: { $in: teamIds },
      dueAt: { $gte: now, $lte: new Date(Date.now() + 7*24*3600*1000) }
    }).populate('team', 'name').sort({ dueAt: 1 }).limit(10);

    // 권한별 알림 및 추가 정보
    const notifications = [];
    let additionalStats = {};

    if (role === Roles.ADMIN || role === Roles.EXECUTIVE) {
      // 승인 요청 개수
      const pendingApprovals = await User.countDocuments({ 
        approvalStatus: 'pending',
        ...(role === Roles.EXECUTIVE ? { clubId } : {})
      });

      const pendingRoleRequests = await RoleRequest.countDocuments({ 
        status: 'pending',
        ...(role === Roles.EXECUTIVE ? { clubId } : {})
      });

      if (pendingApprovals > 0) {
        notifications.push({
          type: 'approval',
          message: `${pendingApprovals}명의 사용자 승인 대기`,
          count: pendingApprovals,
          link: '/admin/approvals'
        });
      }

      if (pendingRoleRequests > 0) {
        notifications.push({
          type: 'role_request',
          message: `${pendingRoleRequests}건의 권한 요청 대기`,
          count: pendingRoleRequests,
          link: '/admin/approvals'
        });
      }

      // 관리자/임원용 추가 통계
      const totalUsers = await User.countDocuments(
        role === Roles.EXECUTIVE ? { clubId, isApproved: true } : { isApproved: true }
      );

      const inactiveTeams = teams.filter(t => {
        const lastReport = reportsThisWeek.find(r => String(r.team) === String(t._id));
        return !lastReport;
      });

      additionalStats = {
        totalUsers,
        inactiveTeams: inactiveTeams.length,
        pendingApprovals,
        pendingRoleRequests
      };
    }

    // KPI 계산
    const kpi = {};
    if (role === Roles.ADMIN || role === Roles.EXECUTIVE) {
      kpi.teams = teams.length;
      kpi.activeTeams = teams.filter(t => 
        reportsThisWeek.some(r => String(r.team) === String(t._id))
      ).length;
      kpi.avgProgress = Math.round(
        (avgByTeam.reduce((a,c) => a + (c.avgProgress || 0), 0) / Math.max(1, avgByTeam.length)) * 10
      ) / 10 || 0;
      
      const submittedTeams = new Set(reportsThisWeek.map(r => String(r.team)));
      kpi.submitRateThisWeek = Math.round((submittedTeams.size / Math.max(1, teams.length)) * 100);
      
      if (role === Roles.EXECUTIVE) {
        kpi.totalUsers = additionalStats.totalUsers;
      } else {
        // ADMIN용 전체 동아리 수
        const totalClubs = await Team.distinct('clubId');
        kpi.totalClubs = totalClubs.length;
      }
    } else {
      // LEADER/MEMBER용 개인 통계
      const myReports = reportsThisWeek.filter(r => String(r.author._id) === String(meId));
      const overdueReports = await Report.countDocuments({ 
        team: { $in: teamIds }, 
        dueAt: { $lt: now },
        ...(role === Roles.MEMBER ? { author: meId } : {})
      });

      kpi.myTeams = teams.length;
      kpi.myReportsThisWeek = myReports.length;
      kpi.overdue = overdueReports;
      kpi.avgProgress = Math.round(
        (avgByTeam.reduce((a,c) => a + (c.avgProgress || 0), 0) / Math.max(1, avgByTeam.length)) * 10
      ) / 10 || 0;

      // 개인 알림
      if (overdueReports > 0) {
        notifications.push({
          type: 'overdue',
          message: `${overdueReports}건의 지연된 보고서`,
          count: overdueReports,
          link: '/reports'
        });
      }
    }

    // 팀 진행률 히스토리 (최근 4주)
    const fourWeeksAgo = new Date(Date.now() - 28*24*3600*1000);
    const recentReports = await Report.find({ 
      team: { $in: teamIds }, 
      weekOf: { $gte: fourWeeksAgo } 
    }).sort({ weekOf: 1 });

    const histByTeam = {};
    recentReports.forEach(r => {
      const key = String(r.team);
      if (!histByTeam[key]) histByTeam[key] = [];
      histByTeam[key].push({ weekOf: r.weekOf, progress: r.progress });
    });

    const myTeamsProgress = teams.slice(0, 8).map(t => ({
      teamId: t._id,
      teamName: t.name,
      history: (histByTeam[String(t._id)] || []).slice(-4).map(x => x.progress || 0)
    }));

    res.json({
      scope,
      kpi,
      dueSoon: dueSoon.map(d => ({
        _id: d._id,
        title: d.title || 'Untitled Report',
        team: d.team?.name || 'Unknown Team',
        dueAt: d.dueAt,
        progress: d.progress || 0
      })),
      myTeamsProgress,
      notifications,
      additionalStats
    });
  } catch (e) { next(e); }
});

// 팀별 건강도(최근 4주) — ADMIN은 clubId 선택 가능, EXEC는 본인 클럽
router.get('/health', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const role = req.user.role;
    const meId = req.user.id;
    const clubIdParam = req.query.clubId;

    let teams = [];
    if (role === Roles.ADMIN) {
      teams = await Team.find(clubIdParam ? { clubId: clubIdParam } : {});
    } else if (role === Roles.EXECUTIVE) {
      teams = await Team.find({ clubId: req.user.clubId });
    } else {
      teams = await Team.find({ 'members.user': meId });
    }
    const teamIds = teams.map(t => t._id);
    const fourWeeksAgo = new Date(Date.now() - 28*24*3600*1000);
    const recent = await Report.find({ team: { $in: teamIds }, weekOf: { $gte: fourWeeksAgo } })
      .sort({ weekOf: 1 });

    const map = {};
    teams.forEach(t => { map[String(t._id)] = { teamId: t._id, teamName: t.name, weeks: [] }; });
    recent.forEach(r => {
      const key = String(r.team);
      if (!map[key]) return;
      map[key].weeks.push({ week: r.weekOf, progress: r.progress });
    });

    res.json(Object.values(map));
  } catch (e) { next(e); }
});

// 활동 피드(간이): 최근 팀 생성/보고서 생성 중심
router.get('/activity', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const role = req.user.role;
    const meId = req.user.id;
    const clubIdParam = req.query.clubId;
    const limit = Math.min(50, Number(req.query.limit || 20));

    let teams = [];
    if (role === Roles.ADMIN) {
      teams = await Team.find(clubIdParam ? { clubId: clubIdParam } : {});
    } else if (role === Roles.EXECUTIVE) {
      teams = await Team.find({ clubId: req.user.clubId });
    } else {
      teams = await Team.find({ 'members.user': meId });
    }
    const teamIds = teams.map(t => t._id);

    const recentTeams = await Team.find({ _id: { $in: teamIds } }).sort({ createdAt: -1 }).limit(limit);
    const recentReports = await Report.find({ team: { $in: teamIds } }).sort({ createdAt: -1 }).limit(limit);

    const feed = [
      ...recentTeams.map(t => ({ type:'team.created', title:`팀 생성: ${t.name}`, at: t.createdAt })),
      ...recentReports.map(r => ({ type:'report.created', title:`보고서 제출: ${r.team}`, at: r.createdAt }))
    ].sort((a,b)=> new Date(b.at) - new Date(a.at)).slice(0, limit);

    res.json(feed);
  } catch (e) { next(e); }
});

export default router;
