// API服务层，处理所有与后端的通信

/**
 * 发送消息到后端API（非流式版本）
 * @param message 用户输入的消息
 * @param sessionId 会话ID
 * @param userId 用户ID
 * @returns Promise，解析为API响应数据
 */
export const sendMessageToAPI = async (message: string, sessionId?: string, userId?: string) => {
  try {
    console.log('[DEBUG] 尝试连接后端API（非流式）...');
    // 使用相对路径，让Vite的代理处理转发
    const apiUrl = '/api/chat';
    console.log('[DEBUG] API URL:', apiUrl);

    // 生成新的session_id（如果未提供）
    const newSessionId = sessionId || `session_${Date.now()}`;
    const finalUserId = userId || localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
    console.log('[DEBUG] 使用会话ID:', newSessionId);
    console.log('[DEBUG] 使用用户ID:', finalUserId);

    // 保存user_id到localStorage
    localStorage.setItem('userId', finalUserId);
    // 如果没有提供sessionId，清除旧的session_id，确保每次都是新的
    if (!sessionId) {
      localStorage.removeItem('sessionId');
    }

    const requestBody = {
      message: message.trim(),
      session_id: newSessionId,
      user_id: finalUserId,
    };
    console.log('[DEBUG] 请求体:', requestBody);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[DEBUG] 响应状态:', response.status);
    console.log('[DEBUG] 响应头:', response.headers);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[DEBUG] 收到回复:', data);

    // 保存session_id到localStorage
    if (data.session_id) {
      localStorage.setItem('sessionId', data.session_id);
    }

    // 清除相关缓存
    const userId = localStorage.getItem('userId');
    if (userId && data.session_id) {
      clearHistoryCache(data.session_id, userId);
      clearSessionsCache(userId);
    }

    return data;
  } catch (error) {
    console.error('[ERROR] 连接后端失败:', error);
    throw new Error(`无法连接到后端服务器: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * 发送消息并接收流式响应
 * @param message 用户输入的消息
 * @param sessionId 会话ID
 * @param userId 用户ID
 * @returns 返回一个可迭代的结果，每次迭代接收一个数据块
 */
export const sendMessageStream = async (message: string, sessionId?: string, userId?: string) => {
  try {
    console.log('[DEBUG] 尝试连接后端流式API...');
    // 使用相对路径，让Vite的代理处理转发
    const apiUrl = '/api/chat/stream';
    console.log('[DEBUG] API URL:', apiUrl);

    // 生成新的session_id（如果未提供）
    const newSessionId = sessionId || `session_${Date.now()}`;
    const finalUserId = userId || localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
    console.log('[DEBUG] 使用会话ID:', newSessionId);
    console.log('[DEBUG] 使用用户ID:', finalUserId);

    // 保存user_id到localStorage
    localStorage.setItem('userId', finalUserId);
    // 如果没有提供sessionId，清除旧的session_id，确保每次都是新的
    if (!sessionId) {
      localStorage.removeItem('sessionId');
    }

    const requestBody = {
      message: message.trim(),
      session_id: newSessionId,
      user_id: finalUserId,
    };
    console.log('[DEBUG] 请求体:', requestBody);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[DEBUG] 响应状态:', response.status);
    console.log('[DEBUG] 响应头:', response.headers);
    const contentType = response.headers.get('content-type');
    console.log('[DEBUG] 响应内容类型:', contentType);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 检查是否为流式响应
    if (!contentType || !contentType.includes('text/event-stream')) {
      console.error('[ERROR] 服务器未返回流式响应');
      const text = await response.text();
      console.error('[ERROR] 响应内容:', text);
      throw new Error('服务器未返回流式响应');
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法获取流式响应读取器');
    }

    console.log('[DEBUG] 开始处理流式响应...');
    let chunkCount = 0;

    // 返回一个异步迭代器
    return {
      async *[Symbol.asyncIterator]() {
        let buffer = '';
        let contentBuffer = '';
        let lineCount = 0;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('[DEBUG] 流式响应读取完成');
              break;
            }

            // 解码二进制数据为文本
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            lineCount++;

            // 按行分割数据
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一行可能不完整的数据

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  chunkCount++;
                  console.log(`[DEBUG] 处理第 ${chunkCount} 个数据块，类型: ${data.type}`);

                  if (data.type === 'content') {
                    contentBuffer += data.content;
                    console.log(`[DEBUG] 收到内容数据，当前内容长度: ${contentBuffer.length}`);
                    yield {
                      content: data.content,
                      type: 'content' as const,
                      session_id: newSessionId,
                      full_content: contentBuffer
                    };
                  } else if (data.type === 'done') {
                    console.log('[DEBUG] 收到完成信号');
                    yield {
                      content: '',
                      type: 'done' as const,
                      session_id: newSessionId,
                      full_content: contentBuffer
                    };
                    return;
                  } else if (data.type === 'error') {
                    console.error('[ERROR] 收到错误信号:', data.message);
                    yield {
                      content: '',
                      type: 'error' as const,
                      message: data.message || '未知错误',
                      session_id: newSessionId,
                      full_content: contentBuffer
                    };
                    return;
                  }
                } catch (e) {
                  console.error('[ERROR] 解析流数据时出错:', e);
                  console.error('[ERROR] 错误行内容:', line);
                  yield {
                    content: '',
                    type: 'error' as const,
                    message: `解析数据时出错: ${e instanceof Error ? e.message : String(e)}`,
                    session_id: newSessionId,
                    full_content: contentBuffer
                  };
                  return;
                }
              }
            }
          }
        } catch (error) {
          console.error('[ERROR] 流式请求出错:', error);
          yield {
            content: '',
            type: 'error' as const,
            message: error instanceof Error ? error.message : '未知错误',
            session_id: newSessionId,
            full_content: contentBuffer
          };
        } finally {
          reader.releaseLock();
          console.log(`[DEBUG] 流式响应处理完成，共处理 ${chunkCount} 个数据块，${lineCount} 行数据`);
          
          // 清除相关缓存
          const userId = localStorage.getItem('userId');
          if (userId && newSessionId) {
            clearHistoryCache(newSessionId, userId);
            clearSessionsCache(userId);
          }
        }
      }
    };
  } catch (error) {
    console.error('[ERROR] 连接后端失败:', error);
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

// 导出流式响应类型定义
export interface StreamChunk {
  content: string;
  type: 'content' | 'done' | 'error';
  message?: string; // 仅在type为error时使用
  session_id?: string;
  full_content?: string; // 当前完整的累积内容
}

// 导入缓存服务
import { cacheService } from './cacheService';

/**
 * 获取聊天历史记录(带缓存)
 * @param session_id 会话ID
 * @param user_id 用户ID
 * @param limit 返回记录数量限制
 * @returns Promise，解析为聊天历史记录
 */
export const getChatHistory = async (session_id: string, user_id?: string, limit: number = 50) => {
  // 生成缓存键
  const cacheKey = `history:${session_id}:${user_id || 'all'}:${limit}`;

  // 尝试从缓存获取
  const cachedData = cacheService.get<{ messages: any[] }>(cacheKey);
  if (cachedData) {
    console.log('[DEBUG] 从缓存获取历史记录');
    return cachedData;
  }

  // 缓存未命中，从API获取
  console.log('[DEBUG] 从API获取历史记录');
  try {
    const apiUrl = `/api/chat/history?session_id=${encodeURIComponent(session_id)}${user_id ? `&user_id=${encodeURIComponent(user_id)}` : ''}&limit=${limit}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 存入缓存，设置30分钟过期
    cacheService.set(cacheKey, data, 30);

    return data;
  } catch (error) {
    console.error('[ERROR] 获取历史记录失败:', error);
    throw new Error(`获取历史记录失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * 获取用户会话列表(带缓存)
 * @param user_id 用户ID
 * @param limit 返回会话数量限制
 * @returns Promise，解析为用户会话列表
 */
export const getUserSessions = async (user_id: string, limit: number = 20) => {
  // 生成缓存键
  const cacheKey = `sessions:${user_id}:${limit}`;

  // 尝试从缓存获取
  const cachedData = cacheService.get<{ sessions: any[] }>(cacheKey);
  if (cachedData) {
    console.log('[DEBUG] 从缓存获取用户会话');
    return cachedData;
  }

  // 缓存未命中，从API获取
  console.log('[DEBUG] 从API获取用户会话');
  try {
    const apiUrl = `/api/chat/sessions?user_id=${encodeURIComponent(user_id)}&limit=${limit}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 存入缓存，设置30分钟过期
    cacheService.set(cacheKey, data, 30);

    return data;
  } catch (error) {
    console.error('[ERROR] 获取用户会话失败:', error);
    throw new Error(`获取用户会话失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * 清除指定会话的历史记录缓存
 * @param session_id 会话ID
 * @param user_id 用户ID
 */
export const clearHistoryCache = (session_id: string, user_id?: string) => {
  // 生成缓存键
  const cacheKey = `history:${session_id}:${user_id || 'all'}:${50}`; // 使用默认limit值
  cacheService.remove(cacheKey);
};

/**
 * 清除用户会话缓存
 * @param user_id 用户ID
 */
export const clearSessionsCache = (user_id: string) => {
  // 生成缓存键
  const cacheKey = `sessions:${user_id}:20`; // 使用默认limit值
  cacheService.remove(cacheKey);
};
