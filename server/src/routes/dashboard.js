import { Router } from 'express';
import { Report } from '../models/Report.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { RoleRequest } from '../models/RoleRequest.js';
import { TeamIssue } from '../models/TeamIssue.js';
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
    
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // 이번 주 통계 계산
    const reportsThisWeek = await Report.find({ 
      team: { $in: teamIds }, 
      weekOf: { $gte: startOfWeek } 
    }).populate('author', 'username email');

    // 지난 주 통계 계산
    const reportsLastWeek = await Report.find({ 
      team: { $in: teamIds }, 
      weekOf: { $gte: startOfLastWeek, $lt: startOfWeek } 
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

      // 권한별 사용자 분포
      const roleDistribution = await User.aggregate([
        { $match: role === Roles.EXECUTIVE ? { clubId, isApproved: true } : { isApproved: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      // 최근 가입자 (최근 7일)
      const recentUsers = await User.find({
        ...(role === Roles.EXECUTIVE ? { clubId } : {}),
        isApproved: true,
        createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
      }).select('username email role createdAt').sort({ createdAt: -1 }).limit(5);

      additionalStats = {
        totalUsers,
        inactiveTeams: inactiveTeams.length,
        pendingApprovals,
        pendingRoleRequests,
        roleDistribution,
        recentUsers
      };
    }

    // 지난 주 평균 진행률 계산
    const avgByTeamLastWeek = await Report.aggregate([
      { $match: { 
        team: { $in: teamIds }, 
        weekOf: { $gte: startOfLastWeek, $lt: startOfWeek } 
      }},
      { $group: { _id: '$team', avgProgress: { $avg: '$progress' } } }
    ]);

    // KPI 계산 및 트렌드 분석
    const kpi = {};
    let trends = {};
    
    if (role === Roles.ADMIN || role === Roles.EXECUTIVE) {
      // 이번 주 기본 통계
      kpi.teams = teams.length;
      const activeTeamsThisWeek = teams.filter(t => 
        reportsThisWeek.some(r => String(r.team) === String(t._id))
      ).length;
      kpi.activeTeams = activeTeamsThisWeek;
      
      const avgProgressThisWeek = Math.round(
        (avgByTeam.reduce((a,c) => a + (c.avgProgress || 0), 0) / Math.max(1, avgByTeam.length)) * 10
      ) / 10 || 0;
      kpi.avgProgress = avgProgressThisWeek;
      
      const submittedTeamsThisWeek = new Set(reportsThisWeek.map(r => String(r.team)));
      const submitRateThisWeek = Math.round((submittedTeamsThisWeek.size / Math.max(1, teams.length)) * 100);
      kpi.submitRateThisWeek = submitRateThisWeek;

      // 지난 주 통계
      const activeTeamsLastWeek = teams.filter(t => 
        reportsLastWeek.some(r => String(r.team) === String(t._id))
      ).length;
      
      const avgProgressLastWeek = Math.round(
        (avgByTeamLastWeek.reduce((a,c) => a + (c.avgProgress || 0), 0) / Math.max(1, avgByTeamLastWeek.length)) * 10
      ) / 10 || 0;
      
      const submittedTeamsLastWeek = new Set(reportsLastWeek.map(r => String(r.team)));
      const submitRateLastWeek = Math.round((submittedTeamsLastWeek.size / Math.max(1, teams.length)) * 100);

      // 90% 이상 달성 팀 수
      const highPerformingTeamsThisWeek = avgByTeam.filter(t => t.avgProgress >= 90).length;
      const highPerformingTeamsLastWeek = avgByTeamLastWeek.filter(t => t.avgProgress >= 90).length;

      // 트렌드 계산
      trends = {
        avgProgress: avgProgressThisWeek - avgProgressLastWeek,
        submitRate: submitRateThisWeek - submitRateLastWeek,
        activeTeams: activeTeamsThisWeek - activeTeamsLastWeek,
        highPerformingTeams: highPerformingTeamsThisWeek - highPerformingTeamsLastWeek
      };

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

      // LEADER용 추가 통계
      if (role === Roles.LEADER) {
        // 내가 리더인 팀들
        const myLeaderTeams = await Team.find({
          $or: [
            { leader: meId },
            { 'members': { $elemMatch: { user: meId, role: 'LEADER' } } }
          ]
        }).populate('members.user', 'username email');

        // 팀원별 기여도 계산 (최근 4주 보고서 기준)
        const fourWeeksAgo = new Date(Date.now() - 28*24*3600*1000);
        const teamMemberContributions = [];
        
        for (const team of myLeaderTeams) {
          const members = team.members || [];
          for (const member of members) {
            const memberReports = await Report.find({
              team: team._id,
              author: member.user._id,
              weekOf: { $gte: fourWeeksAgo }
            });
            
            const avgProgress = memberReports.length > 0 
              ? Math.round(memberReports.reduce((sum, r) => sum + r.progress, 0) / memberReports.length)
              : 0;
              
            teamMemberContributions.push({
              id: member.user._id,
              name: member.user.username,
              email: member.user.email,
              role: member.role,
              contribution: avgProgress,
              reportsCount: memberReports.length,
              teamName: team.name
            });
          }
        }

        // 대기 중인 팀 가입 신청
        const { TeamJoinRequest } = await import('../models/TeamJoinRequest.js');
        const pendingJoinRequests = await TeamJoinRequest.find({
          teamId: { $in: myLeaderTeams.map(t => t._id) },
          status: 'pending'
        }).populate('userId', 'username email');

        // 최근 팀 활동 (보고서 제출, 멤버 가입 등)
        const recentTeamActivities = [];
        
        // 최근 보고서 제출
        const recentReports = await Report.find({
          team: { $in: myLeaderTeams.map(t => t._id) }
        }).populate('author', 'username').populate('team', 'name').sort({ createdAt: -1 }).limit(10);
        
        recentReports.forEach(report => {
          recentTeamActivities.push({
            type: 'report_submitted',
            message: `${report.author.username}님이 ${report.team.name} 보고서를 제출했습니다.`,
            timestamp: report.createdAt,
            teamName: report.team.name
          });
        });

        // 팀 이슈 조회 (최근 열린 이슈들)
        const teamIssues = await TeamIssue.find({
          team: { $in: myLeaderTeams.map(t => t._id) },
          status: { $in: ['open', 'in_progress'] }
        }).populate('reportedBy', 'username').sort({ createdAt: -1 }).limit(10);

        const formattedIssues = teamIssues.map(issue => ({
          id: issue._id,
          type: issue.type,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          createdAt: issue.createdAt,
          reportedBy: issue.reportedBy?.username
        }));

        additionalStats.teamMemberContributions = teamMemberContributions;
        additionalStats.pendingJoinRequests = pendingJoinRequests;
        additionalStats.recentTeamActivities = recentTeamActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
        additionalStats.myLeaderTeams = myLeaderTeams;
        additionalStats.teamIssues = formattedIssues;
      }

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
      trends,
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
