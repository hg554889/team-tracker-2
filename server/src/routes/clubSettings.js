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

    // 접근 권한 확인: ADMIN은 모든 동아리, EXECUTIVE는 자신의 동아리만
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
    next(e); 
  }
});

// 동아리 설정 업데이트
router.put('/:clubId', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { role, clubId: userClubId } = req.user;

    // 설정 변경 권한 확인 (ADMIN 또는 해당 동아리의 EXECUTIVE)
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
    next(e); 
  }
});

// 동아리 통계 조회
router.get('/:clubId/stats', requireAuth, requireClubAccess, async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { role, clubId: userClubId } = req.user;

    if (role !== Roles.ADMIN && clubId !== userClubId) {
      return res.status(403).json({ error: 'ClubAccessDenied' });
    }

    // 동아리 통계 계산
    const { Team } = await import('../models/Team.js');
    const { Report } = await import('../models/Report.js');
    const { User } = await import('../models/User.js');

    const [teams, reports, users] = await Promise.all([
      Team.countDocuments({ clubId }),
      Report.countDocuments({ clubId }),
      User.countDocuments({ clubId, isApproved: true })
    ]);

    const recentReports = await Report.find({ clubId })
      .sort({ createdAt: -1 })
      .limit(30);

    const avgProgress = recentReports.length > 0
      ? recentReports.reduce((sum, r) => sum + (r.progress || 0), 0) / recentReports.length
      : 0;

    const stats = {
      totalTeams: teams,
      totalReports: reports,
      totalUsers: users,
      avgProgress: Math.round(avgProgress * 10) / 10,
      activeTeamsThisWeek: 0, // TODO: 이번 주 활동한 팀 수 계산
      recentActivity: recentReports.slice(0, 10).map(r => ({
        type: 'report',
        title: `보고서 제출`,
        createdAt: r.createdAt,
        progress: r.progress
      }))
    };

    res.json(stats);
  } catch (e) { 
    next(e); 
  }
});

export default router;