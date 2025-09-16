import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/**
 * 팀 유형과 프로젝트 특성에 맞는 보고서 템플릿 생성
 */
export async function generateReportTemplate(teamType, projectCategory, projectDescription) {
  try {
    const prompt = `
팀 유형: ${teamType}
프로젝트 카테고리: ${projectCategory}
프로젝트 설명: ${projectDescription}

위 정보를 바탕으로 주간 보고서 템플릿을 생성해주세요. 새로운 보고서 형식에 맞는 모든 필드를 포함하여 JSON 형식으로 응답해주세요:

{
  "weeklyGoalsPeriod": "📅 주간 목표 및 기간\\n• 구체적인 목표 1 (기간: YYYY.MM.DD ~ YYYY.MM.DD)\\n• 구체적인 목표 2 (담당: 담당자명)\\n• 달성 가능한 목표 3",
  "progressDetails": "📝 진행 내역\\n• 월요일: 구체적인 작업 내용\\n• 화요일: 진행된 작업\\n• 수요일: 완료된 업무\\n• 목요일: 검토 및 테스트\\n• 금요일: 정리 및 문서화",
  "achievements": "🏆 주요 성과\\n• 핵심 기능 구현 완료\\n• 성과 지표 달성\\n• 품질 기준 충족",
  "completedTasks": "✅ 완료된 업무\\n✅ 완료 업무 1\\n✅ 완료 업무 2\\n✅ 완료 업무 3",
  "incompleteTasks": "❌ 미완료 업무\\n❌ 미완료 업무 1 (사유: 구체적인 이유)\\n❌ 미완료 업무 2 (대응방안: 해결 계획)",
  "issues": "⚠️ 이슈 및 고민사항\\n• 기술적 이슈나 문제점\\n• 리소스 관련 고민\\n• 일정상의 제약사항",
  "nextWeekPlans": "📋 다음주 계획\\n• 우선순위 1: 구체적인 계획\\n• 우선순위 2: 진행할 업무\\n• 우선순위 3: 목표 달성 방안",
  "suggestedProgress": 75,
  "tips": "💡 ${teamType} ${projectCategory} 프로젝트 진행 팁"
}

각 필드는 해당 팀 유형과 프로젝트 카테고리에 맞는 실용적이고 구체적인 내용으로 작성해주세요.
모든 내용은 한국어로, 실제 업무에 바로 활용할 수 있도록 구체적으로 작성해주세요.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSON 파싱 시도
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (parseError) {
      // JSON 파싱 실패 시 새로운 형식의 기본 템플릿 반환
      return {
        weeklyGoalsPeriod: `📅 ${teamType} - ${projectCategory} 주간 목표\n• 핵심 기능 개발 완료\n• 품질 기준 달성\n• 팀 협업 효율성 향상`,
        progressDetails: `📝 이번 주 진행 내역\n• 월요일: 프로젝트 계획 및 설계 검토\n• 화요일-수요일: 핵심 기능 개발 진행\n• 목요일: 테스트 및 품질 검증\n• 금요일: 문서화 및 주간 정리`,
        achievements: `🏆 주요 성과\n• 계획된 기능 구현 완료\n• 코드 품질 기준 달성\n• 팀워크 향상 및 소통 개선`,
        completedTasks: `✅ 완료된 업무\n✅ 기본 구조 설계 완료\n✅ 핵심 로직 구현\n✅ 단위 테스트 작성`,
        incompleteTasks: `❌ 미완료 업무\n❌ 추가 기능 개발 (다음 주 우선 진행)\n❌ 통합 테스트 (리소스 확보 후 진행)`,
        issues: `⚠️ 이슈 및 고민사항\n• 프로젝트 진행 시 발생할 수 있는 기술적 리스크\n• 일정 지연 가능성에 대한 대응 방안 필요\n• 리소스 부족 시 우선순위 조정 검토`,
        nextWeekPlans: `📋 다음주 계획\n• 미완료 업무 우선 완료\n• 추가 기능 개발 착수\n• 중간 점검 및 품질 검토`,
        suggestedProgress: 75,
        tips: `💡 ${teamType} ${projectCategory} 프로젝트 진행 팁\n정기적인 진행상황 점검과 팀원 간 원활한 소통을 통해 프로젝트를 성공적으로 완수하세요.`
      };
    }
  } catch (error) {
    console.error('AI template generation error:', error);
    throw new Error('템플릿 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 과거 데이터를 기반으로 다음 주 진행률 예측
 */
export async function predictNextWeekProgress(historicalData, currentProgress, currentGoals, currentIssues) {
  try {
    const progressHistory = historicalData.map(d => d.progress).join(', ');
    const trend = calculateTrend(historicalData);
    
    const prompt = `
과거 진행률 히스토리: [${progressHistory}]%
현재 진행률: ${currentProgress}%
현재 목표: ${currentGoals}
현재 이슈: ${currentIssues}
최근 트렌드: ${trend}

위 데이터를 분석하여 다음 주 예상 진행률과 권장사항을 JSON 형식으로 제공해주세요:

{
  "predictedProgress": 85,
  "confidence": "높음/보통/낮음",
  "reasoning": "예측 근거 설명",
  "recommendations": ["권장사항1", "권장사항2", "권장사항3"],
  "riskFactors": ["리스크 요인1", "리스크 요인2"]
}

분석은 현실적이고 데이터 기반으로 해주세요. 한국어로 응답해주세요.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (parseError) {
      return {
        predictedProgress: Math.min(100, currentProgress + trend),
        confidence: '보통',
        reasoning: '과거 데이터와 현재 진행상황을 종합적으로 고려한 예측입니다.',
        recommendations: ['정기적인 진행상황 점검', '팀원 간 소통 강화', '리스크 요인 모니터링'],
        riskFactors: ['일정 지연 가능성', '리소스 부족 위험']
      };
    }
  } catch (error) {
    console.error('AI progress prediction error:', error);
    throw new Error('진행률 예측 중 오류가 발생했습니다.');
  }
}

/**
 * 현재 상황에 맞는 현실적 목표 제안
 */
export async function suggestRealisticGoals(teamData, projectData, currentProgress, timeRemaining, teamSize) {
  try {
    const prompt = `
팀 정보:
- 팀 크기: ${teamSize}명
- 프로젝트 유형: ${projectData.category || '일반'}
- 프로젝트 설명: ${projectData.description || ''}

현재 상황:
- 현재 진행률: ${currentProgress}%
- 남은 기간: ${timeRemaining}
- 팀 평균 진행률: ${teamData.avgProgress || 0}%

위 정보를 바탕으로 현실적이고 달성 가능한 목표를 제안해주세요. JSON 형식으로:

{
  "shortTermGoals": ["1주 목표1", "1주 목표2"],
  "mediumTermGoals": ["1개월 목표1", "1개월 목표2"],
  "keyMilestones": ["핵심 마일스톤1", "핵심 마일스톤2"],
  "resourceNeeds": ["필요 리소스1", "필요 리소스2"],
  "timeline": "추천 타임라인",
  "successMetrics": ["성공 지표1", "성공 지표2"]
}

SMART 원칙(구체적, 측정가능, 달성가능, 관련성, 시간제한)을 적용해주세요. 한국어로 응답해주세요.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (parseError) {
      return {
        shortTermGoals: ['현재 진행 중인 작업 완료', '다음 단계 계획 수립'],
        mediumTermGoals: ['주요 기능 개발 완료', '테스트 및 검증 진행'],
        keyMilestones: ['프로토타입 완성', '베타 테스트 시작'],
        resourceNeeds: ['추가 개발 시간', '팀원 간 협업 도구'],
        timeline: '단계별 2주 스프린트 권장',
        successMetrics: ['완료된 기능 수', '품질 지표']
      };
    }
  } catch (error) {
    console.error('AI goal suggestion error:', error);
    throw new Error('목표 제안 중 오류가 발생했습니다.');
  }
}

/**
 * 진행률 트렌드 계산 헬퍼 함수
 */
function calculateTrend(data) {
  if (data.length < 2) return 0;
  
  const recent = data.slice(-3); // 최근 3개 데이터포인트
  const weights = [1, 2, 3]; // 최근 데이터에 더 높은 가중치
  
  let weightedSum = 0;
  let weightSum = 0;
  
  for (let i = 0; i < recent.length - 1; i++) {
    const diff = recent[i + 1].progress - recent[i].progress;
    weightedSum += diff * weights[i];
    weightSum += weights[i];
  }
  
  return weightSum > 0 ? Math.round(weightedSum / weightSum) : 0;
}