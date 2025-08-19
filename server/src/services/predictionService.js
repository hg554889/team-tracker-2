import { Report } from '../models/Report.js';
import { Team } from '../models/Team.js';

export class PredictionService {
  static async predictProjectCompletion(teamId) {
    try {
      console.log('PredictionService: Finding team', teamId);
      const team = await Team.findById(teamId);
      if (!team) {
        console.log('PredictionService: Team not found');
        throw new Error('Team not found');
      }

      console.log('PredictionService: Finding reports for team');
      const reports = await Report.find({ teamId })
        .sort({ weekOf: -1 })
        .limit(10);

      console.log('PredictionService: Found', reports.length, 'reports');

      if (reports.length < 1) {
        return {
          predictedCompletionDate: null,
          confidence: 0,
          message: '예측을 위해 보고서가 필요합니다.',
          currentProgress: 0,
          recommendations: [
            '첫 번째 주간 보고서를 작성해주세요.',
            '진행률을 정확히 기록해주세요.',
            '목표와 실제 성과를 비교 분석해주세요.'
          ]
        };
      }

      if (reports.length < 2) {
        const currentProgress = reports[0]?.progress || 0;
        const remainingProgress = 100 - currentProgress;
        const estimatedWeeks = remainingProgress / 10; // 간단한 추정
        const predictedDate = new Date();
        predictedDate.setDate(predictedDate.getDate() + (estimatedWeeks * 7));

        return {
          predictedCompletionDate: predictedDate,
          confidence: 30,
          message: '데이터가 부족하여 간단한 추정만 가능합니다.',
          currentProgress,
          remainingWeeks: Math.ceil(estimatedWeeks),
          averageWeeklyProgress: '10.0',
          recentTrend: '0.0',
          recommendations: [
            '더 많은 주간 보고서를 작성하여 예측 정확도를 향상시켜주세요.',
            '진행률을 정확히 기록해주세요.',
            '목표와 실제 성과를 비교 분석해주세요.'
          ]
        };
      }

      try {
        const analysis = this.analyzeProgressTrend(reports);
        const prediction = this.calculateCompletionDate(analysis, team);
        return prediction;
      } catch (analysisError) {
        console.error('Analysis error:', analysisError);
        // 분석 실패시 간단한 대안 제공
        const currentProgress = reports[0]?.progress || 0;
        const remainingProgress = 100 - currentProgress;
        const estimatedWeeks = remainingProgress / 15;
        const predictedDate = new Date();
        predictedDate.setDate(predictedDate.getDate() + (estimatedWeeks * 7));

        return {
          predictedCompletionDate: predictedDate,
          confidence: 25,
          message: '간단한 추정 결과입니다.',
          currentProgress,
          remainingWeeks: Math.ceil(estimatedWeeks),
          averageWeeklyProgress: '15.0',
          recentTrend: '0.0',
          recommendations: [
            '프로젝트 진행률을 지속적으로 기록해주세요.',
            '목표 달성을 위해 계획을 점검해보세요.'
          ]
        };
      }
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  static analyzeProgressTrend(reports) {
    const sortedReports = reports.sort((a, b) => new Date(a.weekOf) - new Date(b.weekOf));
    const progressData = sortedReports.map((report, index) => ({
      week: index + 1,
      progress: report.progress,
      date: new Date(report.weekOf),
      goals: report.goals?.length || 0,
      issues: report.issues?.length || 0
    }));

    // 선형 회귀를 사용한 진행률 추세 분석
    const { slope, intercept } = this.linearRegression(
      progressData.map(d => d.week),
      progressData.map(d => d.progress)
    );

    // 진행률 변화 패턴 분석
    const progressChanges = [];
    for (let i = 1; i < progressData.length; i++) {
      progressChanges.push(progressData[i].progress - progressData[i-1].progress);
    }

    const averageWeeklyProgress = progressChanges.reduce((sum, change) => sum + change, 0) / progressChanges.length;
    const progressVariability = this.calculateVariability(progressChanges);

    // 최근 성과 트렌드 (최근 3주)
    const recentReports = progressData.slice(-3);
    const recentTrend = recentReports.length > 1 ? 
      (recentReports[recentReports.length - 1].progress - recentReports[0].progress) / (recentReports.length - 1) : 0;

    return {
      slope,
      intercept,
      averageWeeklyProgress,
      progressVariability,
      recentTrend,
      currentProgress: progressData[progressData.length - 1].progress,
      totalWeeks: progressData.length,
      progressData
    };
  }

  static calculateCompletionDate(analysis, team) {
    const { currentProgress, averageWeeklyProgress, recentTrend, progressVariability, slope } = analysis;

    if (currentProgress >= 100) {
      return {
        predictedCompletionDate: new Date(),
        confidence: 100,
        message: '프로젝트가 이미 완료되었습니다.',
        currentProgress,
        recommendations: [
          '완료된 프로젝트를 검토하고 회고를 진행해보세요.',
          '팀원들의 성과를 평가하고 피드백을 제공해보세요.',
          '다음 프로젝트 계획을 수립해보세요.'
        ]
      };
    }

    // 여러 방법론을 조합한 예측
    const remainingProgress = 100 - currentProgress;
    
    // 1. 평균 주간 진행률 기반 예측
    const avgBasedWeeks = averageWeeklyProgress > 0 ? remainingProgress / averageWeeklyProgress : null;
    
    // 2. 최근 트렌드 기반 예측 (가중치 적용)
    const trendBasedWeeks = recentTrend > 0 ? remainingProgress / recentTrend : null;
    
    // 3. 선형 회귀 기반 예측
    const regressionBasedWeeks = slope > 0 ? (100 - (analysis.intercept + slope * analysis.totalWeeks)) / slope : null;

    // 예측값들을 조합 (최근 트렌드에 더 높은 가중치)
    const validPredictions = [avgBasedWeeks, trendBasedWeeks, regressionBasedWeeks].filter(w => w && w > 0);
    
    if (validPredictions.length === 0) {
      return {
        predictedCompletionDate: null,
        confidence: 0,
        message: '현재 진행률로는 완료 예측이 어렵습니다. 프로젝트 계획을 재검토해주세요.',
        currentProgress,
        recommendations: [
          '프로젝트 범위를 재검토해보세요.',
          '팀원들과 현재 상황을 논의해보세요.',
          '목표와 일정을 재조정하는 것을 고려해보세요.',
          '외부 도움이나 추가 리소스가 필요한지 검토해보세요.'
        ]
      };
    }

    // 가중 평균 계산 (최근 트렌드 50%, 평균 30%, 회귀 20%)
    const weights = [0.3, 0.5, 0.2];
    let weightedSum = 0;
    let totalWeight = 0;

    validPredictions.forEach((pred, index) => {
      if (pred) {
        weightedSum += pred * weights[index];
        totalWeight += weights[index];
      }
    });

    const predictedWeeks = weightedSum / totalWeight;
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + (predictedWeeks * 7));

    // 신뢰도 계산 (변동성이 낮을수록, 데이터가 많을수록 높은 신뢰도)
    const dataQuality = Math.min(analysis.totalWeeks / 5, 1); // 5주 이상이면 최대점수
    const consistencyScore = Math.max(0, 1 - (progressVariability / 20)); // 변동성 20% 이하면 최대점수
    const confidence = Math.round((dataQuality * 0.4 + consistencyScore * 0.6) * 100);

    // 추천사항 생성
    const recommendations = this.generateRecommendations(analysis, predictedWeeks);

    // 프로젝트 종료일과 비교
    let message = `예상 완료일은 ${predictedDate.toLocaleDateString('ko-KR')}입니다.`;
    if (team.endAt) {
      const plannedEndDate = new Date(team.endAt);
      const daysDiff = Math.ceil((predictedDate - plannedEndDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 0) {
        message += ` 계획된 종료일보다 ${daysDiff}일 늦을 것으로 예상됩니다.`;
      } else if (daysDiff < 0) {
        message += ` 계획된 종료일보다 ${Math.abs(daysDiff)}일 빠를 것으로 예상됩니다.`;
      } else {
        message += ' 계획된 일정에 맞춰 완료될 것으로 예상됩니다.';
      }
    }

    return {
      predictedCompletionDate: predictedDate,
      confidence,
      message,
      currentProgress,
      remainingWeeks: Math.ceil(predictedWeeks),
      averageWeeklyProgress: averageWeeklyProgress.toFixed(1),
      recentTrend: recentTrend.toFixed(1),
      recommendations
    };
  }

  static generateRecommendations(analysis, predictedWeeks) {
    const recommendations = [];
    const { averageWeeklyProgress, recentTrend, progressVariability, currentProgress } = analysis;

    // 진행률 기반 추천
    if (currentProgress < 30) {
      recommendations.push('프로젝트 초기 단계입니다. 기반 작업에 집중해보세요.');
    } else if (currentProgress < 70) {
      recommendations.push('중간 단계입니다. 핵심 기능 개발에 집중해보세요.');
    } else {
      recommendations.push('마무리 단계입니다. 테스트와 최적화에 집중해보세요.');
    }

    // 트렌드 기반 추천
    if (recentTrend < 0) {
      recommendations.push('최근 진행률이 감소했습니다. 원인을 파악하고 대책을 세워보세요.');
    } else if (recentTrend < 5) {
      recommendations.push('진행 속도가 느립니다. 팀원들과 진행 상황을 점검해보세요.');
    } else if (recentTrend > 15) {
      recommendations.push('좋은 진행 속도를 유지하고 있습니다. 현재 방식을 계속해보세요.');
    }

    // 일정 기반 추천
    if (predictedWeeks > 8) {
      recommendations.push('완료까지 시간이 많이 남았습니다. 중간 목표를 설정해보세요.');
    } else if (predictedWeeks < 2) {
      recommendations.push('완료가 임박했습니다. 최종 점검과 마무리 작업을 준비해보세요.');
    }

    // 변동성 기반 추천
    if (progressVariability > 15) {
      recommendations.push('진행률 변동이 큽니다. 더 안정적인 개발 프로세스를 구축해보세요.');
    }

    return recommendations;
  }

  static linearRegression(xValues, yValues) {
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  static calculateVariability(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
}