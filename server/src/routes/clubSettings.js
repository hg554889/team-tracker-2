import { Router } from 'express';
import { ClubSettings } from '../models/ClubSettings.js';
import { requireAuth } from '../middleware/auth.js';
import { requireClubAccess } from '../middleware/clubAccess.js';
import { Roles } from '../utils/roles.js';

const router = Router();

// 동아리 설정 조회
router.get('/:clubId', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { role, clubId: userClubId } = req.user;

    // ✅ 접근 권한 확인: ADMIN은 모든 동아리, EXECUTIVE는 자신의 동아리만
    if (role !== Roles.ADMIN && role !== Roles.EXECUTIVE) {
      return res.status(403).json({ error: 'InsufficientRole' });
    }
    
    if (role === Roles.EXECUTIVE && clubId !== userClubId) {
      return res.status(403).json({ error: 'ClubAccessDenied' });
    }

    let settings = await ClubSettings.findOne({ clubId });
    
    // 설정이 없으면 기본값으로 생성
    if (!settings) {
      settings = await ClubSettings.create({
        clubId,
        name: `Club ${clubId}`,
        description: `동아리 ${clubId} 설정`,
        settings: {
          reportSettings: {
            defaultDueDays: 7,
            allowLateSubmission: true,
            requireWeeklyReports: true,
            maxTeamSize: 10
          },
          teamSettings: {
            allowMemberCreateTeam: false,
            requireLeaderApproval: true,
            maxTeamsPerUser: 3
          },
          notificationSettings: {
            emailNotifications: true,
            dueDateReminders: true,
            reminderDaysBefore: 2
          }
        },
        theme: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          logo: ''
        }
      });
    }

    res.json(settings);
  } catch (e) { 
    console.error('ClubSettings GET error:', e);
    next(e); 
  }
});

// 동아리 설정 업데이트
router.put('/:clubId', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { role, clubId: userClubId } = req.user;

    // ✅ 설정 변경 권한 확인 (ADMIN 또는 해당 동아리의 EXECUTIVE)
    if (role !== Roles.ADMIN && (role !== Roles.EXECUTIVE || clubId !== userClubId)) {
      return res.status(403).json({ error: 'InsufficientPermissions' });
    }

    const updateData = req.body;
    
    // clubId 변경 방지
    delete updateData.clubId;

    const settings = await ClubSettings.findOneAndUpdate(
      { clubId },
      updateData,
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (e) { 
    console.error('ClubSettings PUT error:', e);
    next(e); 
  }
});

// 전체 동아리 통계 조회 (ADMIN용)
router.get('/stats/all', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const { role } = req.user;

    // ADMIN만 전체 통계 조회 가능
    if (role !== Roles.ADMIN) {
      return res.status(403).json({ error: 'AdminOnly' });
    }

    const { Team } = await import('../models/Team.js');
    const { Report } = await import('../models/Report.js');
    const { User } = await import('../models/User.js');

    // 동아리 목록과 통계 계산
    const { Club } = await import('../models/Club.js');
    const allClubs = await Club.find();
    const clubStats = [];

    for (const club of allClubs) {
      const clubId = club.key;
      if (!clubId) continue; // null/undefined clubId 제외

      const teams = await Team.find({ clubId });
      const teamIds = teams.map(t => t._id);
      
      const [teamCount, reportCount, userCount, recentReports] = await Promise.all([
        Team.countDocuments({ clubId }),
        teamIds.length > 0 ? Report.countDocuments({ team: { $in: teamIds } }) : 0,
        User.countDocuments({ clubId, isApproved: true }),
        teamIds.length > 0 ? Report.find({ team: { $in: teamIds } })
          .populate('team', 'name')
          .sort({ createdAt: -1 })
          .limit(10) : []
      ]);

      const avgProgress = recentReports.length > 0
        ? recentReports.reduce((sum, r) => sum + (r.progress || 0), 0) / recentReports.length
        : 0;

      // 이번 주 활동한 팀 수 계산
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentActiveTeams = teamIds.length > 0 
        ? await Report.distinct('team', {
            team: { $in: teamIds },
            createdAt: { $gte: oneWeekAgo }
          })
        : [];

      clubStats.push({
        clubId,
        clubName: club.name, // 실제 동아리 이름 사용
        totalTeams: teamCount,
        totalReports: reportCount,
        totalUsers: userCount,
        avgProgress: Math.round(avgProgress * 10) / 10,
        activeTeamsThisWeek: recentActiveTeams.length,
        recentActivity: recentReports.slice(0, 5).map(r => ({
          type: 'report',
          title: `${r.team?.name || '팀'} 보고서 제출`,
          createdAt: r.createdAt,
          progress: r.progress || 0
        }))
      });
    }

    // 전체 통계도 계산
    const totalStats = {
      totalClubs: clubStats.length,
      totalTeams: clubStats.reduce((sum, club) => sum + club.totalTeams, 0),
      totalReports: clubStats.reduce((sum, club) => sum + club.totalReports, 0),
      totalUsers: clubStats.reduce((sum, club) => sum + club.totalUsers, 0),
      avgProgress: clubStats.length > 0 
        ? Math.round((clubStats.reduce((sum, club) => sum + club.avgProgress, 0) / clubStats.length) * 10) / 10
        : 0
    };

    res.json({
      totalStats,
      clubStats: clubStats.sort((a, b) => b.totalTeams - a.totalTeams) // 팀 수로 내림차순 정렬
    });
  } catch (e) { 
    console.error('ClubSettings all stats error:', e);
    next(e); 
  }
});

// 동아리 통계 조회
router.get('/:clubId/stats', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { role, clubId: userClubId } = req.user;

    // ✅ 통계 조회 권한 확인: ADMIN은 모든 동아리, EXECUTIVE는 자신의 동아리만
    if (role !== Roles.ADMIN && (role !== Roles.EXECUTIVE || clubId !== userClubId)) {
      return res.status(403).json({ error: 'ClubAccessDenied' });
    }

    // 동아리 통계 계산
    const { Team } = await import('../models/Team.js');
    const { Report } = await import('../models/Report.js');
    const { User } = await import('../models/User.js');

    // ADMIN이면 전체, EXECUTIVE면 해당 동아리만
    const teamFilter = role === Roles.ADMIN ? {} : { clubId };
    const userFilter = role === Roles.ADMIN ? { isApproved: true } : { clubId, isApproved: true };
    
    // 먼저 팀들을 가져와서 해당 팀들의 보고서 조회
    const teams = await Team.find(teamFilter);
    const teamIds = teams.map(t => t._id);
    
    const [teamCount, reportCount, userCount, recentReports] = await Promise.all([
      Team.countDocuments(teamFilter),
      teamIds.length > 0 ? Report.countDocuments({ team: { $in: teamIds } }) : 0,
      User.countDocuments(userFilter),
      teamIds.length > 0 ? Report.find({ team: { $in: teamIds } })
        .populate('team', 'name')
        .sort({ createdAt: -1 })
        .limit(30) : []
    ]);

    const avgProgress = recentReports.length > 0
      ? recentReports.reduce((sum, r) => sum + (r.progress || 0), 0) / recentReports.length
      : 0;

    // 이번 주 활동한 팀 수 계산
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActiveTeams = teamIds.length > 0 
      ? await Report.distinct('team', {
          team: { $in: teamIds },
          createdAt: { $gte: oneWeekAgo }
        })
      : [];

    const stats = {
      totalTeams: teamCount,
      totalReports: reportCount,
      totalUsers: userCount,
      avgProgress: Math.round(avgProgress * 10) / 10,
      activeTeamsThisWeek: recentActiveTeams.length,
      recentActivity: recentReports.slice(0, 10).map(r => ({
        type: 'report',
        title: `${r.team?.name || '팀'} 보고서 제출`,
        createdAt: r.createdAt,
        progress: r.progress || 0
      }))
    };

    res.json(stats);
  } catch (e) { 
    console.error('ClubSettings stats error:', e);
    next(e); 
  }
});

export default router;