import { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';

function App() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  
  // 从localStorage获取session_id
  const savedSessionId = localStorage.getItem('sessionId');

  const handleSendMessage = async () => {
    if (message.trim()) {
      setIsLoading(true);
      console.log('发送消息:', message);

      try {
        console.log('尝试连接后端API...');
        // 使用相对路径，让Vite的代理处理转发
        const apiUrl = '/api/chat';
        console.log('API URL:', apiUrl);

        // 生成新的session_id
        const sessionId = `session_${Date.now()}`;
        const userId = localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
        
        // 保存user_id到localStorage，但不保存session_id，确保每次都是新的
        localStorage.setItem('userId', userId);
        // 清除旧的session_id，确保每次都是新的
        localStorage.removeItem('sessionId');
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message.trim(),
            session_id: sessionId,
            user_id: userId,
          }),
        });

        console.log('响应状态:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('收到回复:', data);


        // 保存session_id到localStorage    
        localStorage.setItem('sessionId', data.session_id);
        // 跳转到聊天页面
        setTimeout(() => {
          window.location.href = `/chat/${data.session_id}`;
        }, 200); // 0.2秒后跳转

      } catch (error) {
        console.error('连接后端失败:', error);
        alert(`无法连接到后端服务器: ${error.message}`);
      } finally {
        setIsLoading(false);
        setMessage('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const features = [
    {
      title: '合同风险审查',
      description: '请帮站在甲方的立场下，审查下这份合同，提炼出核心风险点，并返回修订版word文件。'
    },
    {
      title: '盖章版律师函',
      description: '对方公司的微信公众号名称，侵犯我司"律友"的42类商标，请起草一份律师函。'
    },
    {
      title: '专业法律报告',
      description: '请你深入研究，出一份案情分析报告，案情如下:张三开公司的车给客户送货，发生交通事故...'
    },
    {
      title: '法律咨询',
      description: '针对您的法律问题，提供专业解答和建议，帮助您了解相关法律规定和应对策略。'
    }
  ];

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
          <button className="nav-button new-chat-btn">
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
          <h1>Hi，我是律友 你的AI法律助手</h1>
          <p>专业、可靠、智能且亲切的法律咨询伙伴</p>
        </div>

        {/* 主体内容布局 */}
        <div className="content-layout">
          <div className="feature-cards">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" onClick={() => console.log('点击功能:', feature.title)}>
                <h3 className="feature-card-title">{feature.title}</h3>
                <p className="feature-card-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 用户输入区 */}
        <section className="input-section">
          <div className="input-container">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入法律问题，剩下的交给律友"
              rows={3}
            />
            <div className="input-buttons">
              <button className="upload-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </button>
              <button className="send-button" onClick={handleSendMessage} disabled={isLoading}>
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
        </section>
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

export default App;
