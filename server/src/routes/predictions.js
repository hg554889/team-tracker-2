import express from 'express';
import { PredictionService } from '../services/predictionService.js';
import { Team } from '../models/Team.js';
import { Report } from '../models/Report.js';
import { StatusCodes } from 'http-status-codes';

// 헬퍼 함수: 팀 멤버 여부 확인
function isTeamMember(team, userId) {
  if (!team || !team.members || !userId) return false;
  
  return team.members.some(m => {
    // m.user 가 ObjectId 또는 populated document 모두 지원
    const memberUserId =
      m.user && m.user._id ? m.user._id.toString() : m.user?.toString?.();
    return memberUserId === userId.toString();
  });
}

const router = express.Router();

// 프로젝트 완료일 예측
router.get('/completion/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { user } = req;

    console.log('Prediction request for team:', teamId);

    // 팀 존재 확인 및 권한 체크
    const team = await Team.findById(teamId);
    if (!team) {
      console.log('Team not found:', teamId);
      return res.status(StatusCodes.NOT_FOUND).json({
        message: '팀을 찾을 수 없습니다.'
      });
    }

    // 팀 멤버이거나 관리자인지 확인
    const isMember = isTeamMember(team, user.id);
    
    if (!isMember && user.role !== 'ADMIN' && user.role !== 'EXECUTIVE') {
      console.log('Access denied for user:', user._id);
      return res.status(StatusCodes.FORBIDDEN).json({
        message: '해당 팀의 예측 데이터에 접근할 권한이 없습니다.'
      });
    }

    console.log('Calling PredictionService...');
    const prediction = await PredictionService.predictProjectCompletion(teamId);
    console.log('Prediction successful');

    res.json({
      success: true,
      data: prediction
    });

  } catch (error) {
    console.error('Prediction error details:', error);
    console.error('Error stack:', error.stack);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: '예측 분석 중 오류가 발생했습니다.',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 팀의 진행률 분석 데이터
router.get('/progress-analysis/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { user } = req;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: '팀을 찾을 수 없습니다.'
      });
    }

    const isMember = isTeamMember(team, user.id);
    
    if (!isMember && user.role !== 'ADMIN' && user.role !== 'EXECUTIVE') {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: '해당 팀의 분석 데이터에 접근할 권한이 없습니다.'
      });
    }

    // 진행률 분석을 위한 보고서 데이터 가져오기
    const reports = await Report.find({ team: teamId })
      .sort({ weekOf: 1 })
      .select('weekOf progress goals issues createdAt');

    if (reports.length === 0) {
      return res.json({
        success: true,
        data: {
          message: '분석할 보고서 데이터가 없습니다.',
          chartData: [],
          insights: []
        }
      });
    }

    // 차트용 데이터 생성
    const chartData = reports.map((report, index) => ({
      week: `${index + 1}주차`,
      date: new Date(report.weekOf).toLocaleDateString('ko-KR'),
      progress: report.progress,
      weekOf: report.weekOf
    }));

    // 인사이트 생성
    const insights = [];
    const progressValues = reports.map(r => r.progress);
    const avgProgress = progressValues.reduce((a, b) => a + b, 0) / progressValues.length;

    insights.push(`평균 진행률: ${avgProgress.toFixed(1)}%`);

    if (reports.length > 1) {
      const firstProgress = reports[0].progress;
      const lastProgress = reports[reports.length - 1].progress;
      const totalGrowth = lastProgress - firstProgress;
      insights.push(`총 진행률 증가: ${totalGrowth.toFixed(1)}%`);

      const weeklyAverage = totalGrowth / (reports.length - 1);
      insights.push(`주간 평균 증가율: ${weeklyAverage.toFixed(1)}%`);
    }

    res.json({
      success: true,
      data: {
        chartData,
        insights,
        totalReports: reports.length,
        averageProgress: avgProgress.toFixed(1)
      }
    });

  } catch (error) {
    console.error('Progress analysis error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: '진행률 분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;