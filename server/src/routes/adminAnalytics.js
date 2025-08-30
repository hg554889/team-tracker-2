import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Report } from '../models/Report.js';
import { Club } from '../models/Club.js';

const router = Router();

// 전체 시스템 분석 데이터 조회
router.get('/', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    // 기간 설정
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // 병렬로 데이터 수집
    const [
      totalUsers,
      totalClubs,
      totalTeams,
      activeTeams,
      recentUsers,
      recentReports,
      userGrowth,
      teamStats,
      reportStats
    ] = await Promise.all([
      User.countDocuments(),
      Club.countDocuments(),
      Team.countDocuments(),
      Team.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Report.countDocuments({ createdAt: { $gte: startDate } }),
      getUserGrowthData(period),
      getTeamActivityStats(),
      getReportStats(startDate)
    ]);

    const analytics = {
      overview: {
        totalUsers,
        totalClubs,
        totalTeams,
        activeTeams,
        inactiveTeams: totalTeams - activeTeams,
        newUsersThisPeriod: recentUsers,
        reportsThisPeriod: recentReports
      },
      userGrowth,
      teamActivity: {
        active: activeTeams,
        inactive: totalTeams - activeTeams,
        total: totalTeams,
        ...teamStats
      },
      reportStats,
      systemHealth: {
        userEngagement: Math.round((recentUsers / Math.max(totalUsers, 1)) * 100),
        teamActivity: Math.round((activeTeams / Math.max(totalTeams, 1)) * 100),
        reportSubmissionRate: reportStats.submissionRate || 0
      },
      period,
      generatedAt: new Date().toISOString()
    };

    res.json(analytics);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    next(error);
  }
});

// 사용자 증가 추이 데이터 생성
async function getUserGrowthData(period) {
  try {
    const now = new Date();
    const dataPoints = [];
    let intervals = 7;
    let intervalDays = 1;

    switch (period) {
      case '7d':
        intervals = 7;
        intervalDays = 1;
        break;
      case '30d':
        intervals = 15;
        intervalDays = 2;
        break;
      case '90d':
        intervals = 12;
        intervalDays = 7;
        break;
      case '1y':
        intervals = 12;
        intervalDays = 30;
        break;
    }

    for (let i = intervals - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * intervalDays));
      
      const userCount = await User.countDocuments({
        createdAt: { $lte: date }
      });

      dataPoints.push({
        date: date.toISOString().split('T')[0],
        users: userCount,
        label: formatDateLabel(date, period)
      });
    }

    return dataPoints;
  } catch (error) {
    console.error('Failed to generate user growth data:', error);
    return [];
  }
}

// 팀 활동 통계
async function getTeamActivityStats() {
  try {
    const [
      teamsByClub,
      recentlyCreatedTeams,
      teamsWithRecentReports
    ] = await Promise.all([
      Team.aggregate([
        { $group: { _id: '$clubId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Team.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      Team.countDocuments({
        lastReportDate: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
      })
    ]);

    return {
      byClub: teamsByClub,
      recentlyCreated: recentlyCreatedTeams,
      withRecentActivity: teamsWithRecentReports
    };
  } catch (error) {
    console.error('Failed to get team activity stats:', error);
    return {};
  }
}

// 보고서 통계
async function getReportStats(startDate) {
  try {
    const [
      totalReports,
      submittedReports,
      pendingReports,
      overdueReports,
      reportsByStatus
    ] = await Promise.all([
      Report.countDocuments({ createdAt: { $gte: startDate } }),
      Report.countDocuments({ 
        createdAt: { $gte: startDate },
        status: 'submitted'
      }),
      Report.countDocuments({ 
        createdAt: { $gte: startDate },
        status: 'draft'
      }),
      Report.countDocuments({
        createdAt: { $gte: startDate },
        dueDate: { $lt: new Date() },
        status: { $ne: 'submitted' }
      }),
      Report.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const submissionRate = totalReports > 0 
      ? Math.round((submittedReports / totalReports) * 100)
      : 0;

    return {
      total: totalReports,
      submitted: submittedReports,
      pending: pendingReports,
      overdue: overdueReports,
      submissionRate,
      byStatus: reportsByStatus
    };
  } catch (error) {
    console.error('Failed to get report stats:', error);
    return {
      total: 0,
      submitted: 0,
      pending: 0,
      overdue: 0,
      submissionRate: 0,
      byStatus: []
    };
  }
}

// 날짜 라벨 포맷팅
function formatDateLabel(date, period) {
  const options = {};
  
  switch (period) {
    case '7d':
      options.weekday = 'short';
      break;
    case '30d':
      options.month = 'short';
      options.day = 'numeric';
      break;
    case '90d':
    case '1y':
      options.month = 'short';
      break;
  }

  return date.toLocaleDateString('ko-KR', options);
}

// 클럽별 상세 분석
router.get('/clubs/:clubId', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { period = '30d' } = req.query;

    const club = await Club.findOne({ key: clubId });
    if (!club) {
      return res.status(404).json({ error: '동아리를 찾을 수 없습니다.' });
    }

    const [
      memberCount,
      teamCount,
      activeTeams,
      recentReports
    ] = await Promise.all([
      User.countDocuments({ clubId }),
      Team.countDocuments({ clubId }),
      Team.countDocuments({ clubId, isActive: { $ne: false } }),
      Report.countDocuments({ 
        clubId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      club: {
        key: club.key,
        name: club.name
      },
      stats: {
        memberCount,
        teamCount,
        activeTeams,
        inactiveTeams: teamCount - activeTeams,
        recentReports
      },
      period,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch club analytics:', error);
    next(error);
  }
});

// 실시간 시스템 메트릭스
router.get('/metrics', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const metrics = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version
      },
      database: {
        connectionState: 'connected', // MongoDB 연결 상태는 실제 구현에서 확인
        lastQuery: new Date().toISOString()
      },
      application: {
        activeUsers: await User.countDocuments({ 
          lastLoginAt: { 
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
          }
        }),
        onlineUsers: await User.countDocuments({ 
          lastActivityAt: { 
            $gte: new Date(Date.now() - 15 * 60 * 1000) 
          }
        }),
        todayReports: await Report.countDocuments({
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        })
      },
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    console.error('Failed to fetch system metrics:', error);
    next(error);
  }
});

export default router;