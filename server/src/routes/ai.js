import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate as validateRequest } from '../middleware/validate.js';
import { generateReportTemplate, predictNextWeekProgress, suggestRealisticGoals } from '../services/aiService.js';
import { Team } from '../models/Team.js';
import { Report } from '../models/Report.js';

const router = Router();

// 스키마 정의
const templateRequestSchema = z.object({
  body: z.object({
    teamId: z.string().min(1),
    teamType: z.string().min(1),
    projectCategory: z.string().min(1),
    projectDescription: z.string().optional().default('')
  })
});

const predictionRequestSchema = z.object({
  body: z.object({
    teamId: z.string().min(1),
    currentProgress: z.number().min(0).max(100),
    currentGoals: z.string().optional().default(''),
    currentIssues: z.string().optional().default('')
  })
});

const goalsRequestSchema = z.object({
  body: z.object({
    teamId: z.string().min(1),
    currentProgress: z.number().min(0).max(100),
    timeRemaining: z.string().min(1),
    projectCategory: z.string().optional().default('일반')
  })
});

/**
 * POST /api/ai/template - 보고서 템플릿 생성
 */
router.post('/template', requireAuth, validateRequest(templateRequestSchema), async (req, res, next) => {
  try {
    const { teamId, teamType, projectCategory, projectDescription } = req.body;
    
    // 팀 접근 권한 확인
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const { id: userId, role } = req.user;
    const isMember = team.members.some(m => m.user.toString() === userId);
    const isLeader = team.leader?.toString() === userId;
    
    if (role !== 'ADMIN' && role !== 'EXECUTIVE' && !isMember && !isLeader) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // AI 템플릿 생성
    const template = await generateReportTemplate(teamType, projectCategory, projectDescription);
    
    res.json({
      success: true,
      template,
      message: '보고서 템플릿이 생성되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/predict-progress - 진행률 예측
 */
router.post('/predict-progress', requireAuth, validateRequest(predictionRequestSchema), async (req, res, next) => {
  try {
    const { teamId, currentProgress, currentGoals, currentIssues } = req.body;
    
    // 팀 접근 권한 확인
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const { id: userId, role } = req.user;
    const isMember = team.members.some(m => m.user.toString() === userId);
    const isLeader = team.leader?.toString() === userId;
    
    if (role !== 'ADMIN' && role !== 'EXECUTIVE' && !isMember && !isLeader) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // 과거 보고서 데이터 가져오기 (최근 8주)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    
    const historicalReports = await Report.find({
      team: teamId,
      weekOf: { $gte: eightWeeksAgo }
    }).sort({ weekOf: 1 }).select('progress weekOf goals issues');
    
    // 히스토리 데이터 포맷팅
    const historicalData = historicalReports.map(report => ({
      week: report.weekOf,
      progress: report.progress,
      goals: report.goals,
      issues: report.issues
    }));
    
    // AI 예측 실행
    const prediction = await predictNextWeekProgress(
      historicalData, 
      currentProgress, 
      currentGoals, 
      currentIssues
    );
    
    res.json({
      success: true,
      prediction,
      historicalData: historicalData.slice(-4), // 최근 4주만 클라이언트에 전송
      message: '진행률 예측이 완료되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/suggest-goals - 목표 제안
 */
router.post('/suggest-goals', requireAuth, validateRequest(goalsRequestSchema), async (req, res, next) => {
  try {
    const { teamId, currentProgress, timeRemaining, projectCategory } = req.body;
    
    // 팀 접근 권한 확인
    const team = await Team.findById(teamId).populate('members.user', 'username');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const { id: userId, role } = req.user;
    const isMember = team.members.some(m => m.user._id.toString() === userId);
    const isLeader = team.leader?.toString() === userId;
    
    if (role !== 'ADMIN' && role !== 'EXECUTIVE' && !isMember && !isLeader) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // 팀 데이터 수집
    const teamReports = await Report.find({ team: teamId })
      .sort({ weekOf: -1 })
      .limit(10)
      .select('progress weekOf');
    
    const avgProgress = teamReports.length > 0 
      ? Math.round(teamReports.reduce((sum, r) => sum + r.progress, 0) / teamReports.length)
      : 0;
    
    const teamData = {
      name: team.name,
      memberCount: team.members.length,
      avgProgress
    };
    
    const projectData = {
      category: projectCategory,
      description: team.description || ''
    };
    
    // AI 목표 제안
    const suggestions = await suggestRealisticGoals(
      teamData,
      projectData, 
      currentProgress, 
      timeRemaining, 
      team.members.length
    );
    
    res.json({
      success: true,
      suggestions,
      teamData,
      message: '목표 제안이 완료되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/team-insights/:teamId - 팀 인사이트 종합
 */
router.get('/team-insights/:teamId', requireAuth, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    
    // 팀 접근 권한 확인
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const { id: userId, role } = req.user;
    const isMember = team.members.some(m => m.user.toString() === userId);
    const isLeader = team.leader?.toString() === userId;
    
    if (role !== 'ADMIN' && role !== 'EXECUTIVE' && !isMember && !isLeader) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // 최근 보고서 데이터 수집
    const recentReports = await Report.find({ team: teamId })
      .sort({ weekOf: -1 })
      .limit(12)
      .select('progress weekOf goals issues dueAt');
    
    if (recentReports.length === 0) {
      return res.json({
        success: true,
        insights: {
          trend: 'insufficient_data',
          averageProgress: 0,
          consistency: 'unknown',
          recommendations: ['보고서 데이터를 더 축적한 후 분석이 가능합니다.']
        }
      });
    }
    
    // 간단한 통계 분석
    const progressValues = recentReports.map(r => r.progress);
    const avgProgress = Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length);
    
    // 트렌드 계산
    const recentThree = progressValues.slice(0, 3);
    const olderThree = progressValues.slice(3, 6);
    
    let trend = 'stable';
    if (recentThree.length >= 3 && olderThree.length >= 3) {
      const recentAvg = recentThree.reduce((a, b) => a + b, 0) / recentThree.length;
      const olderAvg = olderThree.reduce((a, b) => a + b, 0) / olderThree.length;
      
      if (recentAvg > olderAvg + 5) trend = 'improving';
      else if (recentAvg < olderAvg - 5) trend = 'declining';
    }
    
    // 일관성 계산 (표준편차 기반)
    const variance = progressValues.reduce((sum, val) => {
      return sum + Math.pow(val - avgProgress, 2);
    }, 0) / progressValues.length;
    const stdDev = Math.sqrt(variance);
    
    let consistency = 'consistent';
    if (stdDev > 20) consistency = 'inconsistent';
    else if (stdDev > 10) consistency = 'moderate';
    
    res.json({
      success: true,
      insights: {
        trend,
        averageProgress: avgProgress,
        consistency,
        reportCount: recentReports.length,
        lastReportDate: recentReports[0]?.weekOf,
        recommendations: generateBasicRecommendations(trend, consistency, avgProgress)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 기본 권장사항 생성 헬퍼
function generateBasicRecommendations(trend, consistency, avgProgress) {
  const recommendations = [];
  
  if (trend === 'declining') {
    recommendations.push('진행률 하락 추세를 점검하고 장애 요인을 파악해보세요.');
    recommendations.push('팀원 간 소통을 강화하고 지원이 필요한 영역을 확인하세요.');
  } else if (trend === 'improving') {
    recommendations.push('좋은 진행률 향상 추세입니다. 현재 방식을 유지하세요.');
  }
  
  if (consistency === 'inconsistent') {
    recommendations.push('진행률 편차가 큽니다. 더 일관된 업무 프로세스 구축을 고려해보세요.');
  }
  
  if (avgProgress < 50) {
    recommendations.push('평균 진행률이 낮습니다. 목표를 재검토하거나 리소스 보강을 고려해보세요.');
  } else if (avgProgress > 90) {
    recommendations.push('높은 성과를 보이고 있습니다. 더 도전적인 목표 설정을 고려해보세요.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('안정적으로 프로젝트가 진행되고 있습니다.');
  }
  
  return recommendations;
}

export default router;