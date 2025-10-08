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
      preview_url?: string;
      id: string;
      name: string;
      type: string;
      size: number;
      path: string;
    }>;
  };
  files?: Array<{
    preview_url?: string;
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
        console.log("[DEBUG] 设置初始消息:", msg);
        console.log("[DEBUG] 设置初始用户ID:", userId);
      }
      if (files && files.length > 0) {
        setInitialFiles(files);
        console.log("[DEBUG] 设置初始文件:", files);
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
        // 确保文件信息正确显示
        let files = msg.files;
        if (!files && msg.additional_data && msg.additional_data.files) {
          files = msg.additional_data.files;
        }

        // 确保每个文件对象都有必要的字段
        if (files && files.length > 0) {
          files = files.map((file: any) => ({
            id: file.id || file._id,
            name: file.name || file.original_name,
            type: file.type || file.file_type,
            size: file.size || file.file_size,
            path: file.path || file.file_path,
            preview_url: file.preview_url
          }));
        }

        return {
          ...msg,
          files: files || []
        };
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
      console.log("[DEBUG] 处理文件上传，文件数量:", files?.length);
      // 如果有文件，先上传文件
      const uploadedFiles: any[] = [];
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
        console.log("[DEBUG] 转换后的文件对象:", fileObjects);

        const uploadResult = await uploadFiles(fileObjects, sessionId, userIdToUse);
        if (uploadResult && uploadResult.files && uploadResult.files.length > 0) {
          uploadedFiles.push(...uploadResult.files);
          console.log('文件上传成功，文件数量:', uploadedFiles.length);
          console.log('上传的文件信息:', uploadedFiles);
        } else {
          console.log('文件上传失败或无文件返回');
        }
      }

      // 添加用户消息到本地状态，立即显示
      const userMessage: ChatMessage = {
        _id: `temp_${Date.now()}`,
        role: 'user',
        content: originalMessage || (uploadedFiles.length > 0 ? '发送了文件' : ''),
        timestamp: new Date().toISOString(),
        files: uploadedFiles.length > 0 ? uploadedFiles.map(file => ({
          id: file.id,
          name: file.original_name || file.name,
          type: file.file_type || file.type,
          size: file.file_size || file.size,
          path: file.file_path,
          preview_url: file.preview_url
        })) : [],
      };
      setMessages(prev => [...prev, userMessage]);
      console.log('添加用户消息:', userMessage);
      console.log('用户消息中的文件:', userMessage.files);

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

      // 文件已在前面上传，无需重复处理

      // 使用apiService发送消息到后端并获取流式响应
      const requestBody: {
        message: string;
        session_id: string;
        user_id: string;
        files?: Array<{
          id: string;
          name: string;
          type: string;
          size: number;
          path: string;
          preview_url?: string;
        }>;
      } = {
        message: originalMessage,
        session_id: sessionId,
        user_id: userIdToUse,
      };
      
      // 如果有上传的文件，添加文件信息
      if (uploadedFiles.length > 0) {
        requestBody.files = uploadedFiles.map(file => ({
          id: file.id,
          name: file.original_name || file.name,
          type: file.file_type || file.type,
          size: file.file_size || file.size,
          path: file.file_path,
          preview_url: file.preview_url
        }));
        console.log('发送文件信息到后端', requestBody.files);
      }
      
      // 直接发送请求，而不是使用sendMessageStream函数
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // 确保userIdToUse有效且不是默认值
      if (userIdToUse && userIdToUse !== 'annotation=NoneType required=False default=None json_schema_extra={}') {
        headers['X-User-ID'] = userIdToUse;
      }
      
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 检查是否为流式响应
      const contentType = response.headers.get('content-type');
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
      
      // 创建一个异步迭代器
      const stream = {
        async *[Symbol.asyncIterator]() {
          let buffer = '';
          let contentBuffer = '';
          
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
              
              // 按行分割数据
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // 保留最后一行可能不完整的数据
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.type === 'content') {
                      contentBuffer += data.content;
                      yield {
                        content: data.content,
                        type: 'content' as const,
                        session_id: sessionId,
                        full_content: contentBuffer
                      };
                    } else if (data.type === 'done') {
                      yield {
                        content: '',
                        type: 'done' as const,
                        session_id: sessionId,
                        full_content: contentBuffer
                      };
                      return;
                    } else if (data.type === 'error') {
                      yield {
                        content: '',
                        type: 'error' as const,
                        message: data.message || '未知错误',
                        session_id: sessionId,
                        full_content: contentBuffer
                      };
                      return;
                    }
                  } catch (e) {
                    yield {
                      content: '',
                      type: 'error' as const,
                      message: `解析数据时出错: ${e instanceof Error ? e.message : String(e)}`,
                      session_id: sessionId,
                      full_content: contentBuffer
                    };
                    return;
                  }
                }
              }
            }
          } catch (error) {
            yield {
              content: '',
              type: 'error' as const,
              message: error instanceof Error ? error.message : '未知错误',
              session_id: sessionId,
              full_content: contentBuffer
            };
          } finally {
            reader.releaseLock();
          }
        }
      };
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

    // 保存原始消息用于清空输入框
    const originalMessage = message;
    const originalFiles = files || [];

    // 使用processStreamResponse处理消息
    await processStreamResponse(originalMessage, sessionId, userId, originalFiles);
    
    // 处理完成后重置状态
    setIsLoading(false);
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
