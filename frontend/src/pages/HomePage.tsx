import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureCards from '../components/FeatureCards';
import InputArea from '../components/InputArea';
import Sidebar from '../components/Sidebar';
import { getUserId } from '../services/apiService';

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  //直接创建新会话并跳转到Chatpage
  const handleSendMessage = async (message: string, files?: any[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;

    setIsLoading(true);

    try {
      // 生成新的会话ID
      const sessionId = `session_${Date.now()}`;
      
      // 生成或获取用户ID
      let userId = localStorage.getItem('userId');
      if (!userId) {
        userId = `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('userId', userId);
      }
      
      console.log('[DEBUG] 使用用户ID:', userId);

      // 直接跳转到聊天页面，并将消息、文件和会话ID作为状态传递
      // 我们将在Chatpage中处理实际的发送逻辑
      navigate(`/chat/${sessionId}`, {
        state: {
          initialMessage: message,
          initialFiles: files,
          userId
        }
      });
    } catch (error) {
      alert(`创建会话失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* 顶部导航区 */}
      <nav className="nav-container">
        <div className="nav-left">
          <button
            className="nav-button sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18m-9-9v18"></path>
            </svg>
            {isSidebarOpen ? '收起' : '展开'}
          </button>
          <button
            className="nav-button new-chat-btn"
            onClick={() => {
              // 生成新的会话ID并跳转到聊天页面
              const newSessionId = `session_${Date.now()}`;
              navigate(`/chat/${newSessionId}`);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            新对话
          </button>
        </div>
        <button className="login-button">登录</button>
      </nav>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* 主体内容区 */}
      <main className="main-container">
        {/* 品牌问候区 */}
        <div className="brand-greeting">
          <h1 className="brand-title">Hi，我是律友 你的AI法律助手</h1>
          <p className="brand-subtitle">专业、可靠、智能且亲切的法律咨询伙伴</p>
        </div>

        {/* 主体内容布局 */}
        <div className="content-layout">
          <FeatureCards />
        </div>

        {/* 用户输入区 */}
        <InputArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>

      {/* 底部信息区 */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#contact">联系我们</a>
          <a href="#terms">用户协议</a>
          <a href="#privacy">隐私政策</a>
        </div>
        <div className="footer-info">
          <span className="footer-support">
            © 2025 律友智能科技有限公司 版权所有
          </span>
          <span className="footer-divider">|</span>
          <span className="footer-disclaimer">
            内容为AI生成，不代表开发者观点
          </span>
        </div>
      </footer>
    </div>
  );
}
