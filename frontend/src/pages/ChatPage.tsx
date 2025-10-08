import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../index.css';
import './ChatPage.css';
import Sidebar from '../components/Sidebar';
import InputArea from '../components/InputArea';
import { ErrorBoundary } from '../components/ErrorBoundary';
import MessageItem from '../components/MessageItem';
import { useChat } from '../hooks/useChat';

/**
 * 聊天页面组件
 * 提供用户与AI进行法律咨询对话的界面
 */
const ChatPage = () => {
  // 从URL参数中获取会话ID
  const { sessionId } = useParams<{ sessionId: string }>();
  // 用于页面导航的hook
  const navigate = useNavigate();
  // 管理输入框内容的state
  const [message, setMessage] = useState('');
  // 管理侧边栏开关状态的state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 使用自定义Hook获取聊天相关状态和方法
  const { 
    messages,            // 聊天消息列表
    isLoading,           // 是否正在加载
    streamingMessageId,  // 正在流式传输的消息ID
    userId,              // 用户ID
    handleSendMessage,   // 发送消息的处理函数
    copyMessageContent, // 复制消息内容的函数
    formatTime,         // 格式化时间的函数
    messagesEndRef       // 滚动到消息底部的ref
  } = useChat(sessionId);

  // 返回上一页的处理函数
  const goBack = () => {
    navigate('/');
  };

  return (
    <ErrorBoundary>
      <div className="chat-page">
        {/* 聊天头部 */}
        <div className="chat-header">
          <div className="header-left">
            {/* 侧边栏切换按钮 */}
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18m-9-9v18"></path>
              </svg>
              {isSidebarOpen ? '收起' : '展开'}
            </button>
            {/* 返回按钮 */}
            <button className="back-button" onClick={goBack}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              返回
            </button>
          </div>
          <h2>法律咨询</h2>
        </div>

        {/* 侧边栏组件 */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* 聊天消息区域 */}
        <div className="chat-messages-outer">
          <div className="chat-messages">
            {/* 空聊天状态提示 */}
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p>暂无聊天记录</p>
              </div>
            ) : (
              // 遍历并渲染每条消息
              messages.map((msg) => (
                <MessageItem
                  key={msg._id}
                  message={msg}
                  onCopy={copyMessageContent}
                  isStreaming={msg._id === streamingMessageId}
                  formatTime={formatTime}
                />
              ))
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* 消息输入区域，支持文件上传 */}
        <InputArea
          onSendMessage={(msg, files) => handleSendMessage(msg, files)}
          isLoading={isLoading}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
          onClearMessage={() => setMessage('')}
        />

        {/* 聊天页脚 */}
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
