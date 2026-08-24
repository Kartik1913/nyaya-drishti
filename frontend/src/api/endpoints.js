import client from './client';

export const loginApi = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  const response = await client.post('/auth/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const getCurrentUserApi = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

export const getPriorityQueueApi = async (page = 1, limit = 20, filters = {}) => {
  const params = { page, limit, ...filters };
  const response = await client.get('/queue', { params });
  return response.data;
};

export const getCaseDetailApi = async (caseId) => {
  const response = await client.get(`/cases/${caseId}`);
  return response.data;
};

export const getCaseTimelineApi = async (caseId) => {
  const response = await client.get(`/cases/${caseId}/timeline`);
  return response.data;
};

export const getAggregateStatsApi = async () => {
  const response = await client.get('/stats/aggregate');
  return response.data;
};

export const getTriageStatsApi = async () => {
  const response = await client.get('/stats/triage');
  return response.data;
};

export const getDemoComparisonApi = async () => {
  const response = await client.get('/demo/comparison');
  return response.data;
};

export const getCaseCohortApi = async (caseId) => {
  const response = await client.get(`/cases/${caseId}/cohort`);
  return response.data;
};

export const triggerReseedApi = async () => {
  const response = await client.post('/admin/reseed');
  return response.data;
};

