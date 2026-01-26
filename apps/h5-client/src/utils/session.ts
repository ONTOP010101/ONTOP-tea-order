// 会话ID管理工具

// 生成唯一会话ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 获取会话ID，如果不存在则生成新的
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// 清除会话ID
export const clearSessionId = (): void => {
  sessionStorage.removeItem('sessionId');
};

// 检查是否有会话ID
export const hasSessionId = (): boolean => {
  return !!sessionStorage.getItem('sessionId');
};
