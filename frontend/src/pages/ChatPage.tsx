import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../index.css';
import './ChatPage.css';
import Sidebar from '../components/Sidebar';
import InputArea from '../components/InputArea';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { sendMessageToAPI } from '../services/apiService';

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

      // 使用apiService发送消息到后端
      const data = await sendMessageToAPI(originalMessage, sessionId, userId);

      // 添加AI回复到本地状态
      const aiMessage: ChatMessage = {
        _id: data.message_id || data.session_id,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // 清空输入框
      setMessage('');
    } catch (error) {
      console.error('发送消息失败:', error);
      alert(`发送消息失败: ${error instanceof Error ? error.message : String(error)}`);
      // 移除临时添加的用户消息
      setMessages(prev => prev.filter(msg => msg._id !== `temp_${Date.now()}`));
    } finally {
      setIsLoading(false);
    }
  };



  const goBack = () => {
    navigate('/');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 初始化欢迎消息
  useEffect(() => {
    if (messages.length === 0 && sessionId) {
      const welcomeMessage: ChatMessage = {
        _id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: '你好！有什么需要帮助的吗？',
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, sessionId]);

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
              messages.map((msg) => (
                <div key={msg._id} className={`message ${msg.role}`}>
                  <div className="message-content">
                    <p>{msg.content}</p>
                  </div>
                  {msg.role === 'assistant' && (
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
              ))
            )}
          </div>
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