import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../index.css';
import './ChatPage.css';
import Sidebar from '../components/Sidebar';
import { ErrorBoundary } from '../components/ErrorBoundary';

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

  // 确保用户ID存在
  const userId = localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', userId);
  }

  // 获取聊天历史
  useEffect(() => {
    if (sessionId) {
      fetchChatHistory(sessionId);
    }
  }, [sessionId]);

  const fetchChatHistory = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/history?session_id=${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      alert(`获取聊天历史失败: ${error.message}`);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !sessionId || isLoading) return;

    setIsLoading(true);
    const originalMessage = message;

    try {
      // 添加用户消息到本地状态，立即显示
      const userMessage: ChatMessage = {
        _id: `temp_${Date.now()}`,
        role: 'user',
        content: originalMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // 发送消息到后端
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: originalMessage,
          session_id: sessionId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 添加AI回复到本地状态
      const aiMessage: ChatMessage = {
        _id: data.message_id,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // 清空输入框
      setMessage('');
    } catch (error) {
      console.error('发送消息失败:', error);
      alert(`发送消息失败: ${error.message}`);
      // 移除临时添加的用户消息
      setMessages(prev => prev.filter(msg => msg._id !== `temp_${Date.now()}`));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const goBack = () => {
    navigate('/');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <p>暂无聊天记录</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className={`message ${msg.role}`}>
                <div className="message-content">
                  <p>{msg.content}</p>
                </div>
                <div className="message-time">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="chat-input">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入法律问题，剩下的交给律友"
            rows={3}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spinner">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ChatPage;