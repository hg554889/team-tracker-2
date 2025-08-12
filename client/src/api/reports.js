import client from './client';
export const createOrUpdateReport = (data) => client.post('/reports', data);
export const teamReports = (teamId) => client.get(`/reports/team/${teamId}`);
export function getReportsByTeam(teamId) {
  return client.get(`/reports/team/${teamId}`);
}
// ⬇️ 새로 추가
export function listReports(params) {
  return client.get('/reports', { params }); // { teamId?, page?, limit?, from?, to? }
}

// ⬇️ 추가
export function getReport(id) {
  return client.get(`/reports/${id}`);
}
// ✅ 추가
export function updateReport(id, data) {
  return client.put(`/reports/${id}`, data);
}
export function addComment(reportId, text) {
  return client.post(`/reports/${reportId}/comments`, { text });
}