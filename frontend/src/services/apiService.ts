// API服务层，处理所有与后端的通信

/**
 * 发送消息到后端API
 * @param message 用户输入的消息
 * @param sessionId 会话ID
 * @param userId 用户ID
 * @returns Promise，解析为API响应数据
 */
export const sendMessageToAPI = async (message: string, sessionId?: string, userId?: string) => {
  try {
    console.log('尝试连接后端API...');
    // 使用相对路径，让Vite的代理处理转发
    const apiUrl = '/api/chat';
    console.log('API URL:', apiUrl);

    // 生成新的session_id（如果未提供）
    const newSessionId = sessionId || `session_${Date.now()}`;
    const finalUserId = userId || localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;

    // 保存user_id到localStorage
    localStorage.setItem('userId', finalUserId);
    // 如果没有提供sessionId，清除旧的session_id，确保每次都是新的
    if (!sessionId) {
      localStorage.removeItem('sessionId');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
        session_id: newSessionId,
        user_id: finalUserId,
      }),
    });

    console.log('响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('收到回复:', data);

    // 保存session_id到localStorage
    if (data.session_id) {
      localStorage.setItem('sessionId', data.session_id);
    }

    return data;
  } catch (error) {
    console.error('连接后端失败:', error);
    throw new Error(`无法连接到后端服务器: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * 获取当前用户ID
 * @returns 用户ID
 */
export const getUserId = (): string => {
  return localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 获取当前会话ID
 * @returns 会话ID
 */
export const getSessionId = (): string | null => {
  return localStorage.getItem('sessionId');
};

/**
 * 清除当前会话ID
 */
export const clearSessionId = (): void => {
  localStorage.removeItem('sessionId');
};