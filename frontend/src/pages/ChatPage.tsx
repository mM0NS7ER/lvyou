import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../index.css';
import './ChatPage.css';
import Sidebar from '../components/Sidebar';
import InputArea from '../components/InputArea';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { sendMessageStream, StreamChunk } from '../services/apiService';

interface ChatMessage {
  _id: string;
  role: string;
  content: string;
  timestamp: string;
}

const ChatPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [initialUserId, setInitialUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<string | null>(null); // 使用ref来存储流式消息ID
  
  // 检查路由状态，获取初始消息和用户ID
  const location = useLocation();
  useEffect(() => {
    if (location.state) {
      const { initialMessage: msg, userId: userId } = location.state as { initialMessage: string; userId: string };
      if (msg && userId) {
        setInitialMessage(msg);
        setInitialUserId(userId);
        console.log('[DEBUG] 接收到初始消息:', msg);
      }
    }
  }, [location.state]);

  console.log('[DEBUG] ChatPage渲染，sessionId:', sessionId);

  // 确保用户ID存在
  const userId = localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', userId);
    console.log('[DEBUG] 设置用户ID:', userId);
  }

  // 获取聊天历史
  useEffect(() => {
    console.log('[DEBUG] 检查sessionId并获取聊天历史:', sessionId);
    if (sessionId) {
      fetchChatHistory(sessionId);
    }
  }, [sessionId]);
  
  // 处理初始消息
  useEffect(() => {
    if (initialMessage && initialUserId && !isLoading) {
      console.log('[DEBUG] 开始处理初始消息:', initialMessage);
      // 清空所有消息，确保只显示用户发送的消息和AI回复
      setMessages([]);
      
      // 创建一个发送函数，直接使用initialMessage而不是依赖message状态
      const sendInitialMessage = async () => {
        console.log('[DEBUG] 发送初始消息:', initialMessage);
        setIsLoading(true);
        const originalMessage = initialMessage;
        const messageStartTime = Date.now();

        try {
          // 添加用户消息到本地状态，立即显示
          const userMessage: ChatMessage = {
            _id: `temp_${Date.now()}`,
            role: 'user',
            content: originalMessage,
            timestamp: new Date().toISOString(),
          };
          console.log('[DEBUG] 添加用户消息:', userMessage._id);
          setMessages(prev => [...prev, userMessage]);

          // 在开始流式响应时生成最终的消息ID，避免后期替换
          const finalMessageId = `msg_${Date.now()}`;
          const tempAssistantMessage: ChatMessage = {
            _id: finalMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
          };
          console.log('[DEBUG] 添加临时助手消息:', tempAssistantMessage._id);
          setMessages(prev => [...prev, tempAssistantMessage]);

          // 同时更新state和ref
          setStreamingMessageId(finalMessageId);
          streamingMessageRef.current = finalMessageId;
          console.log('[DEBUG] 设置流式消息ID:', finalMessageId);

          // 使用apiService发送消息到后端并获取流式响应
          console.log('[DEBUG] 开始调用流式API...');
          // 优先使用initialUserId，如果没有则使用当前userId
          const userIdToUse = initialUserId || userId;
          const stream = await sendMessageStream(originalMessage, sessionId, userIdToUse);
          console.log('[DEBUG] 流式API调用成功，开始处理响应...');

          let fullContent = '';

          for await (const chunk of stream) {
            console.log(`[DEBUG] 处理数据块，类型: ${chunk.type}`);

            if (chunk.type === 'content') {
              // 累积内容
              fullContent += chunk.content;
              console.log(`[DEBUG] 累积内容，当前长度: ${fullContent.length}`);
              console.log(`[DEBUG] 当前内容预览: ${fullContent.substring(0, 20)}...`);

              // 更新临时消息的内容 - 使用ref中的ID
              console.log('[DEBUG] 开始更新消息内容...');
              setMessages(prev => {
                // 创建新数组，确保引用变化
                const newMessages = [...prev];
                const messageId = streamingMessageRef.current; // 从ref中获取ID
                console.log(`[DEBUG] 从ref获取的流式消息ID: ${messageId}`);

                if (messageId) {
                  const messageIndex = newMessages.findIndex(msg => msg._id === messageId);
                  if (messageIndex !== -1) {
                    console.log(`[DEBUG] 找到流式消息在索引 ${messageIndex}，更新内容`);
                    // 创建新对象，确保引用变化
                    newMessages[messageIndex] = {
                      ...newMessages[messageIndex],
                      content: fullContent
                    };

                    // 添加日志，确认更新
                    console.log(`[DEBUG] 更新后的消息内容: ${newMessages[messageIndex].content.substring(0, 20)}...`);
                  } else {
                    console.log(`[DEBUG] 未找到流式消息 ${messageId}`);
                  }
                } else {
                  console.log('[DEBUG] 流式消息ID为空');
                }

                return newMessages;
              });

              console.log('[DEBUG] 消息内容更新完成');
            } else if (chunk.type === 'done') {
              const totalTime = Date.now() - messageStartTime;
              console.log(`[DEBUG] 流式响应完成，总耗时: ${totalTime}ms`);
              console.log(`[DEBUG] 流式响应完成，消息ID: ${streamingMessageRef.current}`);
              console.log(`[DEBUG] 最终内容长度: ${fullContent.length}`);
              console.log(`[DEBUG] 最终内容预览: ${fullContent.substring(0, 20)}...`);

              // 确保最终内容被渲染 - 使用ref中的ID
              console.log('[DEBUG] 开始更新最终消息内容...');
              setMessages(prev => {
                // 创建新数组，确保引用变化
                const newMessages = [...prev];
                const messageId = streamingMessageRef.current; // 从ref中获取ID
                console.log(`[DEBUG] 从ref获取的流式消息ID: ${messageId}`);

                if (messageId) {
                  const messageIndex = newMessages.findIndex(msg => msg._id === messageId);
                  if (messageIndex !== -1) {
                    console.log(`[DEBUG] 找到流式消息在索引 ${messageIndex}，更新最终内容`);
                    // 创建新对象，确保引用变化
                    newMessages[messageIndex] = {
                      ...newMessages[messageIndex],
                      content: fullContent
                    };

                    // 添加日志，确认更新
                    console.log(`[DEBUG] 更新后的最终消息内容: ${newMessages[messageIndex].content.substring(0, 20)}...`);
                  } else {
                    console.log(`[DEBUG] 未找到流式消息 ${messageId}`);
                  }
                } else {
                  console.log('[DEBUG] 流式消息ID为空');
                }

                return newMessages;
              });

              console.log('[DEBUG] 最终消息内容更新完成');

              // 流式结束，保持消息ID不变，只更新状态
              setIsLoading(false);
              setStreamingMessageId(null);
              streamingMessageRef.current = null; // 清除ref
              setMessage(''); // 清空输入框
              console.log('[DEBUG] 流式状态更新完成');
              break;
            } else if (chunk.type === 'error') {
              console.error('[ERROR] 流式响应错误:', chunk.message);
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
              streamingMessageRef.current = null; // 清除ref
              break;
            }
          }
        } catch (error) {
          const totalTime = Date.now() - messageStartTime;
          console.error('[ERROR] 发送消息失败:', error);
          console.error(`[ERROR] 总耗时: ${totalTime}ms`);

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
          streamingMessageRef.current = null; // 清除ref
        }
      };

      // 设置消息到输入框
      setMessage(initialMessage);
      
      // 直接调用发送函数
      sendInitialMessage();
      
      // 清除初始消息和用户ID
      setInitialMessage(null);
      setInitialUserId(null);
    }
  }, [initialMessage, initialUserId, isLoading]);

  // 滚动到最新消息
  useEffect(() => {
    console.log('[DEBUG] 滚动到底部，消息数量:', messages.length);
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async (id: string) => {
    console.log('[DEBUG] 开始获取聊天历史，ID:', id);
    try {
      const response = await fetch(`/api/chat/history?session_id=${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[DEBUG] 获取聊天历史成功，消息数量:', data.messages?.length || 0);
      // 只有当有历史记录时才设置消息，否则保持为空
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('[ERROR] 获取聊天历史失败:', error);
      alert(`获取聊天历史失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !sessionId || isLoading) {
      console.log('[DEBUG] 忽略发送请求: 消息为空', !message.trim(), 'sessionId缺失', !sessionId, '正在加载', isLoading);
      return;
    }

    console.log('[DEBUG] 开始发送消息:', message.substring(0, 50) + '...');
    setIsLoading(true);
    const originalMessage = message;
    const messageStartTime = Date.now();

    try {
      // 添加用户消息到本地状态，立即显示
      const userMessage: ChatMessage = {
        _id: `temp_${Date.now()}`,
        role: 'user',
        content: originalMessage,
        timestamp: new Date().toISOString(),
      };
      console.log('[DEBUG] 添加用户消息:', userMessage._id);
      setMessages(prev => [...prev, userMessage]);

      // 在开始流式响应时生成最终的消息ID，避免后期替换
      const finalMessageId = `msg_${Date.now()}`;
      const tempAssistantMessage: ChatMessage = {
        _id: finalMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      console.log('[DEBUG] 添加临时助手消息:', tempAssistantMessage._id);
      setMessages(prev => [...prev, tempAssistantMessage]);

      // 同时更新state和ref
      setStreamingMessageId(finalMessageId);
      streamingMessageRef.current = finalMessageId;
      console.log('[DEBUG] 设置流式消息ID:', finalMessageId);

      // 使用apiService发送消息到后端并获取流式响应
      console.log('[DEBUG] 开始调用流式API...');
      // 优先使用initialUserId，如果没有则使用当前userId
      const userIdToUse = initialUserId || userId;
      const stream = await sendMessageStream(originalMessage, sessionId, userIdToUse);
      console.log('[DEBUG] 流式API调用成功，开始处理响应...');

      let fullContent = '';

      for await (const chunk of stream) {
        console.log(`[DEBUG] 处理数据块，类型: ${chunk.type}`);

        if (chunk.type === 'content') {
          // 累积内容
          fullContent += chunk.content;
          console.log(`[DEBUG] 累积内容，当前长度: ${fullContent.length}`);
          console.log(`[DEBUG] 当前内容预览: ${fullContent.substring(0, 20)}...`);

          // 更新临时消息的内容 - 使用ref中的ID
          console.log('[DEBUG] 开始更新消息内容...');
          setMessages(prev => {
            // 创建新数组，确保引用变化
            const newMessages = [...prev];
            const messageId = streamingMessageRef.current; // 从ref中获取ID
            console.log(`[DEBUG] 从ref获取的流式消息ID: ${messageId}`);

            if (messageId) {
              const messageIndex = newMessages.findIndex(msg => msg._id === messageId);
              if (messageIndex !== -1) {
                console.log(`[DEBUG] 找到流式消息在索引 ${messageIndex}，更新内容`);
                // 创建新对象，确保引用变化
                newMessages[messageIndex] = {
                  ...newMessages[messageIndex],
                  content: fullContent
                };

                // 添加日志，确认更新
                console.log(`[DEBUG] 更新后的消息内容: ${newMessages[messageIndex].content.substring(0, 20)}...`);
              } else {
                console.log(`[DEBUG] 未找到流式消息 ${messageId}`);
              }
            } else {
              console.log('[DEBUG] 流式消息ID为空');
            }

            return newMessages;
          });

          console.log('[DEBUG] 消息内容更新完成');
        } else if (chunk.type === 'done') {
          const totalTime = Date.now() - messageStartTime;
          console.log(`[DEBUG] 流式响应完成，总耗时: ${totalTime}ms`);
          console.log(`[DEBUG] 流式响应完成，消息ID: ${streamingMessageRef.current}`);
          console.log(`[DEBUG] 最终内容长度: ${fullContent.length}`);
          console.log(`[DEBUG] 最终内容预览: ${fullContent.substring(0, 20)}...`);

          // 确保最终内容被渲染 - 使用ref中的ID
          console.log('[DEBUG] 开始更新最终消息内容...');
          setMessages(prev => {
            // 创建新数组，确保引用变化
            const newMessages = [...prev];
            const messageId = streamingMessageRef.current; // 从ref中获取ID
            console.log(`[DEBUG] 从ref获取的流式消息ID: ${messageId}`);

            if (messageId) {
              const messageIndex = newMessages.findIndex(msg => msg._id === messageId);
              if (messageIndex !== -1) {
                console.log(`[DEBUG] 找到流式消息在索引 ${messageIndex}，更新最终内容`);
                // 创建新对象，确保引用变化
                newMessages[messageIndex] = {
                  ...newMessages[messageIndex],
                  content: fullContent
                };

                // 添加日志，确认更新
                console.log(`[DEBUG] 更新后的最终消息内容: ${newMessages[messageIndex].content.substring(0, 20)}...`);
              } else {
                console.log(`[DEBUG] 未找到流式消息 ${messageId}`);
              }
            } else {
              console.log('[DEBUG] 流式消息ID为空');
            }

            return newMessages;
          });

          console.log('[DEBUG] 最终消息内容更新完成');

          // 流式结束，保持消息ID不变，只更新状态
          setIsLoading(false);
          setStreamingMessageId(null);
          streamingMessageRef.current = null; // 清除ref
          setMessage(''); // 清空输入框
          console.log('[DEBUG] 流式状态更新完成');
          break;
        } else if (chunk.type === 'error') {
          console.error('[ERROR] 流式响应错误:', chunk.message);
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
          streamingMessageRef.current = null; // 清除ref
          break;
        }
      }
    } catch (error) {
      const totalTime = Date.now() - messageStartTime;
      console.error('[ERROR] 发送消息失败:', error);
      console.error(`[ERROR] 总耗时: ${totalTime}ms`);

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
      streamingMessageRef.current = null; // 清除ref
    }
  };

  const goBack = () => {
    navigate('/');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 不再显示初始化欢迎消息

  // 复制消息内容
  const copyMessageContent = (content: string) => {
    console.log('[DEBUG] 复制消息内容');
    navigator.clipboard.writeText(content)
      .then(() => {
        alert('内容已复制到剪贴板');
      })
      .catch(err => {
        console.error('[ERROR] 复制失败:', err);
      });
  };

  // 添加渲染调试信息
  useEffect(() => {
    console.log('=== [DEBUG] 渲染调试信息 ===');
    console.log('[DEBUG] 当前消息列表:', messages.map(m => ({
      id: m._id,
      role: m.role,
      content: m.content,
      contentLength: m.content.length,
      isStreaming: m._id === streamingMessageId
    })));

    // 检查流式消息的状态
    if (streamingMessageId) {
      const streamingMessage = messages.find(m => m._id === streamingMessageId);
      console.log('[DEBUG] 流式消息详情:', {
        id: streamingMessageId,
        content: streamingMessage?.content,
        contentLength: streamingMessage?.content.length,
        isLoading: isLoading
      });
    }

    console.log('=== [DEBUG] 渲染调试信息结束 ===');
  }, [messages, streamingMessageId, isLoading]);

  return (
    <ErrorBoundary>
      <div className="chat-page">
        <div className="chat-header">
          <div className="header-left">
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18m-9-9v18"></path>
              </svg>
              {isSidebarOpen ? '收起' : '展开'}
            </button>
            <button className="back-button" onClick={goBack}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              返回
            </button>
          </div>
          <h2>法律咨询</h2>
        </div>

        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="chat-messages-outer">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p>暂无聊天记录</p>
              </div>
            ) : (
              messages.map((msg) => {
                // 添加每个消息的渲染日志
                console.log(`[DEBUG] 渲染消息: ${msg._id}, 内容长度: ${msg.content.length}, 是否流式: ${msg._id === streamingMessageId}`);

                return (
                  <div
                    key={msg._id}
                    className={`message ${msg.role} ${msg._id === streamingMessageId ? 'streaming' : ''}`}
                  >
                    <div className="message-content">
                      <p>{msg.content}</p>
                      {isLoading && msg._id === streamingMessageId && (
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      )}
                    </div>
                    {msg.role === 'assistant' && msg._id !== streamingMessageId && (
                      <div className="message-actions">
                        <button onClick={() => copyMessageContent(msg.content)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          复制
                        </button>
                        <div className="encryption-badge">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          已加密
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        <InputArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="chat-footer">
          <span><a href="/terms" target="_blank" rel="noopener noreferrer">用户协议</a></span>
          <span>I</span>
          <span><a href="/privacy" target="_blank" rel="noopener noreferrer">隐私政策</a></span>
          <span>I</span>
          <span style={{marginLeft: '3px'}}>由律友提供技术支持</span>
          <span style={{marginLeft: '3px'}}>声明：内容为AI生成，不代表开发者观点</span>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ChatPage;
