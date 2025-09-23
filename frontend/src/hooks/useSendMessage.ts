import { useState } from 'react';
import { sendMessageToAPI, getUserId, getSessionId, clearSessionId } from '../services/apiService';

interface SendMessageOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * 自定义Hook，处理消息发送逻辑
 * @param options 配置选项，包含成功和失败回调
 * @returns 包含发送消息函数和加载状态的对象
 */
export const useSendMessage = (options?: SendMessageOptions) => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (message: string) => {
    setIsLoading(true);

    try {
      const userId = getUserId();
      // 每次发送消息时都创建一个新的会话，不传递现有的sessionId
      const data = await sendMessageToAPI(message, undefined, userId);

      // 调用成功回调（如果提供）
      if (options?.onSuccess) {
        options.onSuccess(data);
      }

      return data;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));

      // 调用错误回调（如果提供）
      if (options?.onError) {
        options.onError(errorObj);
      } else {
        // 如果没有提供错误回调，抛出错误
        throw errorObj;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading,
  };
};