import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sendMessageStream, uploadFiles, sendMessageWithFilesToAPI, StreamChunk } from '../services/apiService';

export interface ChatMessage {
  _id: string;
  role: string;
  content: string;
  timestamp: string;
  additional_data?: {
    timestamp?: string;
    files?: Array<{
      preview_url: string | undefined;
      id: string;
      name: string;
      type: string;
      size: number;
      path: string;
    }>;
  };
  files?: Array<{
    preview_url: string | undefined;
    id: string;
    name: string;
    type: string;
    size: number;
    path: string;
  }>;
}

export const useChat = (sessionId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [initialUserId, setInitialUserId] = useState<string | null>(null);
  const [initialFiles, setInitialFiles] = useState<any[]>([]);
  const streamingMessageRef = useRef<string | null>(null);

  // 获取用户ID
  const userId = localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', userId);
  }

  // 处理路由状态中的初始消息
  const location = useLocation();
  useEffect(() => {
    if (location.state) {
      const { initialMessage: msg, userId: userId, initialFiles: files } = location.state as {
        initialMessage: string;
        userId: string;
        initialFiles?: any[]
      };
      if (msg && userId) {
        setInitialMessage(msg);
        setInitialUserId(userId);
      }
      if (files && files.length > 0) {
        setInitialFiles(files);
      }
    }
  }, [location.state]);

  // 获取聊天历史
  useEffect(() => {
    if (sessionId) {
      fetchChatHistory(sessionId);
    }
  }, [sessionId]);

  // 处理初始消息
  useEffect(() => {
    if ((initialMessage || initialFiles.length > 0) && initialUserId && !isLoading) {
      processInitialMessage();
    }
  }, [initialMessage, initialUserId, isLoading]);

  // 滚动到最新消息
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 获取聊天历史
  const fetchChatHistory = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/history?session_id=${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // 处理历史消息，确保文件信息正确显示
      const processedMessages = data.messages?.map((msg: any) => {
        if (msg.additional_data && msg.additional_data.files && !msg.files) {
          return {
            ...msg,
            files: msg.additional_data.files
          };
        }
        return msg;
      }) || [];

      if (processedMessages.length > 0) {
        setMessages(processedMessages);
      }
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      alert(`获取聊天历史失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 处理流式响应
  const processStreamResponse = async (
    originalMessage: string, 
    sessionId: string, 
    userIdToUse: string,
    files?: any[]
  ) => {
    const messageStartTime = Date.now();

    try {
      // 添加用户消息到本地状态，立即显示
      const userMessage: ChatMessage = {
        _id: `temp_${Date.now()}`,
        role: 'user',
        content: originalMessage,
        timestamp: new Date().toISOString(),
        files: files,
      };
      setMessages(prev => [...prev, userMessage]);

      // 在开始流式响应时生成最终的消息ID
      const finalMessageId = `msg_${Date.now()}`;
      const tempAssistantMessage: ChatMessage = {
        _id: finalMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempAssistantMessage]);

      // 更新state和ref
      setStreamingMessageId(finalMessageId);
      streamingMessageRef.current = finalMessageId;

      // 如果有文件，先上传文件
      let uploadedFiles = [];
      if (files && files.length > 0) {
        const fileObjects = files.map(f => {
          if (f instanceof File) {
            return f;
          }
          if (f.file && f.file instanceof File) {
            return f.file;
          }
          if (f.blobData) {
            return new File([f.blobData], f.name, { type: f.type });
          }
          return null;
        }).filter(f => f !== null);

        const uploadResult = await uploadFiles(fileObjects, sessionId, userIdToUse);
        if (uploadResult && uploadResult.files) {
          uploadedFiles = uploadResult.files;
        }
      }

      // 使用apiService发送消息到后端并获取流式响应
      const stream = await sendMessageStream(originalMessage, sessionId, userIdToUse);
      let fullContent = '';

      for await (const chunk of stream) {
        if (chunk.type === 'content') {
          // 累积内容
          fullContent += chunk.content;

          // 更新临时消息的内容
          setMessages(prev => {
            const newMessages = [...prev];
            const messageId = streamingMessageRef.current;

            if (messageId) {
              const messageIndex = newMessages.findIndex(msg => msg._id === messageId);
              if (messageIndex !== -1) {
                newMessages[messageIndex] = {
                  ...newMessages[messageIndex],
                  content: fullContent
                };
              }
            }
            return newMessages;
          });
        } else if (chunk.type === 'done') {
          // 确保最终内容被渲染
          setMessages(prev => {
            const newMessages = [...prev];
            const messageId = streamingMessageRef.current;

            if (messageId) {
              const messageIndex = newMessages.findIndex(msg => msg._id === messageId);
              if (messageIndex !== -1) {
                newMessages[messageIndex] = {
                  ...newMessages[messageIndex],
                  content: fullContent
                };
              }
            }
            return newMessages;
          });

          // 流式结束，更新状态
          setIsLoading(false);
          setStreamingMessageId(null);
          streamingMessageRef.current = null;
          break;
        } else if (chunk.type === 'error') {
          // 处理错误
          setMessages(prev => {
            const newMessages = [...prev];
            const messageId = streamingMessageRef.current;
            if (messageId) {
              const messageIndex = newMessages.findIndex(msg => msg._id === messageId);
              if (messageIndex !== -1) {
                newMessages[messageIndex] = {
                  ...newMessages[messageIndex],
                  content: `抱歉，处理您的请求时出错: ${chunk.message || '未知错误'}`
                };
              }
            }
            return newMessages;
          });
          setIsLoading(false);
          setStreamingMessageId(null);
          streamingMessageRef.current = null;
          break;
        }
      }
    } catch (error) {
      // 更新临时消息显示错误
      setMessages(prev => {
        const newMessages = [...prev];
        const messageId = streamingMessageRef.current;
        if (messageId) {
          const messageIndex = newMessages.findIndex(msg => msg._id === messageId);
          if (messageIndex !== -1) {
            newMessages[messageIndex] = {
              ...newMessages[messageIndex],
              content: `抱歉，发送消息时出错: ${error instanceof Error ? error.message : String(error)}`
            };
          }
        }
        return newMessages;
      });
      setIsLoading(false);
      setStreamingMessageId(null);
      streamingMessageRef.current = null;
    }
  };

  // 处理初始消息
  const processInitialMessage = async () => {
    if (!initialMessage && initialFiles.length === 0) return;

    setIsLoading(true);

    try {
      // 清空所有消息，确保只显示用户发送的消息和AI回复
      setMessages([]);

      // 使用processStreamResponse处理初始消息
      await processStreamResponse(
        initialMessage || '', 
        sessionId || '', 
        initialUserId || userId,
        initialFiles
      );
    } finally {
      // 清除初始消息和用户ID
      setInitialMessage(null);
      setInitialUserId(null);
    }
  };

  // 发送消息
  const handleSendMessage = async (message: string, files?: any[]) => {
    if (!message.trim() && (!files || files.length === 0) || !sessionId || isLoading) {
      return;
    }

    setIsLoading(true);

    // 立即清空输入框（在调用组件中处理）

    // 使用processStreamResponse处理消息
    await processStreamResponse(message, sessionId, userId, files);
  };

  // 复制消息内容
  const copyMessageContent = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        alert('内容已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
      });
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return {
    messages,
    isLoading,
    streamingMessageId,
    userId,
    handleSendMessage,
    copyMessageContent,
    formatTime,
    messagesEndRef
  };
};
