export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003',
  adminBaseUrl: import.meta.env.VITE_ADMIN_BASE_URL || 'http://localhost:3003'
};

export const apiUrl = (endpoint) => {
  return `${apiConfig.baseUrl}${endpoint}`;
};

export const adminUrl = (endpoint) => {
  return `${apiConfig.adminBaseUrl}${endpoint}`;
};

// 导出默认配置
export default apiConfig;