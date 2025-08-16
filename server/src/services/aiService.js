import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * 팀 유형과 프로젝트 특성에 맞는 보고서 템플릿 생성
 */
export async function generateReportTemplate(teamType, projectCategory, projectDescription) {
  try {
    const prompt = `
팀 유형: ${teamType}
프로젝트 카테고리: ${projectCategory}
프로젝트 설명: ${projectDescription}

위 정보를 바탕으로 주간 보고서 템플릿을 생성해주세요. 다음 형식으로 JSON 응답해주세요:

{
  "goals": "이번 주 목표 (구체적이고 측정 가능한)",
  "issues": "예상되는 이슈나 고려사항",
  "suggestedProgress": 80,
  "tips": "해당 프로젝트 유형에 맞는 진행 팁"
}

응답은 한국어로, 실용적이고 구체적으로 작성해주세요.
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
      // JSON 파싱 실패 시 기본 템플릿 반환
      return {
        goals: text.substring(0, 200) + '...',
        issues: '프로젝트 진행 시 발생할 수 있는 리스크를 미리 식별하고 대응책을 준비해주세요.',
        suggestedProgress: 75,
        tips: '정기적인 진행상황 점검과 팀원 간 소통을 통해 프로젝트를 성공적으로 완수하세요.'
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