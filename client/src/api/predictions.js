import client from './client';

export const getProjectCompletion = async (teamId) => {
  const response = await client.get(`/predictions/completion/${teamId}`);
  return response.data;
};

export const getProgressAnalysis = async (teamId) => {
  const response = await client.get(`/predictions/progress-analysis/${teamId}`);
  return response.data;
};