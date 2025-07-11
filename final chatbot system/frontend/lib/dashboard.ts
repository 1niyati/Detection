import { getToken } from './auth';

const API_URL = 'http://localhost:3001/dashboard';

async function fetchFromDashboard(endpoint: string) {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }

  return response.json();
}

export const getDashboardStats = () => fetchFromDashboard('stats');
export const getSecurityAlerts = () => fetchFromDashboard('alerts');
export const getLoginActivity = () => fetchFromDashboard('login-activity');
export const getUserRoles = () => fetchFromDashboard('user-roles');
export const getRecentActivity = () => fetchFromDashboard('recent-activity');
export const getAllUsers = () => fetchFromDashboard('all-users'); 