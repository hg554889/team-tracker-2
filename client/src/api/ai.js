import client from './client';

/**
 * 보고서 템플릿 생성 요청
 */
export const generateReportTemplate = (data) => {
  return client.post('/ai/template', data);
};

/**
 * 진행률 예측 요청
 */
export const predictProgress = (data) => {
  return client.post('/ai/predict-progress', data);
};

/**
 * 목표 제안 요청
 */
export const suggestGoals = (data) => {
  return client.post('/ai/suggest-goals', data);
};

/**
 * 팀 인사이트 조회
 */
export const getTeamInsights = (teamId) => {
  return client.get(`/ai/team-insights/${teamId}`);
};