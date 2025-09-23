import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

interface ChatHistoryItem {
  session_id: string;
  title: string;
  timestamp: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  refreshKey?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, refreshKey = 0 }) => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  // 获取当前用户ID
  const userId = localStorage.getItem('userId');

  // 获取聊天历史
  useEffect(() => {
    if (userId) {
      fetchChatHistory(userId);
    }
  }, [userId, refreshKey]); // 当refreshKey变化时重新获取聊天记录

  const fetchChatHistory = async (id: string) => {
    try {
      setLoading(true);
      // 首先获取会话列表
      const sessionsResponse = await fetch(`/api/chat/sessions?user_id=${id}&limit=50`);
      if (!sessionsResponse.ok) {
        throw new Error(`HTTP error! status: ${sessionsResponse.status}`);
      }
      const sessionsData = await sessionsResponse.json();

      // 为每个会话获取详细消息，找到第一条用户消息
      const processedHistory = [];

      for (const session of sessionsData.sessions) {
        try {
          // 获取该会话的所有消息
          const messagesResponse = await fetch(`/api/chat/history?session_id=${session.session_id}&user_id=${id}&limit=100`);
          if (!messagesResponse.ok) {
            throw new Error(`HTTP error! status: ${messagesResponse.status}`);
          }
          const messagesData = await messagesResponse.json();

          // 找到第一条用户消息
          const firstUserMessage = messagesData.messages.find((msg: any) => msg.role === 'user');

          // 使用第一条用户消息作为标题
          const title = firstUserMessage && firstUserMessage.content.length > 20
            ? firstUserMessage.content.substring(0, 20) + '...'
            : (firstUserMessage ? firstUserMessage.content : '无标题');

          processedHistory.push({
            session_id: session.session_id,
            title,
            timestamp: session.timestamp
          });
        } catch (error) {
          console.error(`获取会话 ${session.session_id} 的消息失败:`, error);
          // 如果获取详细消息失败，使用最后一条消息作为标题
          const title = session.last_message.length > 20
            ? session.last_message.substring(0, 20) + '...'
            : session.last_message;

          processedHistory.push({
            session_id: session.session_id,
            title,
            timestamp: session.timestamp
          });
        }
      }

      // 按时间戳降序排序
      processedHistory.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setChatHistory(processedHistory);
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      // 在实际应用中，这里可以显示错误信息
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
    onClose();
  };

  const handleNewChat = () => {
    // 生成新的会话ID
    const newSessionId = `session_${Date.now()}`;
    navigate(`/chat/${newSessionId}`);
    onClose();
  };

  const handleDeleteChat = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发聊天记录点击事件
    setSessionToDelete(sessionId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;

    try {
      const response = await fetch(`/api/chat/sessions/${sessionToDelete}?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 从列表中移除已删除的聊天记录
      setChatHistory(prev => prev.filter(item => item.session_id !== sessionToDelete));

      // 如果删除的是当前正在查看的聊天记录，则重定向到首页
      const currentSessionId = window.location.pathname.split('/')[2];
      if (currentSessionId === sessionToDelete) {
        navigate('/');
      }
    } catch (error) {
      console.error('删除聊天记录失败:', error);
      alert(`删除聊天记录失败: ${error.message}`);
    } finally {
      setShowDeleteDialog(false);
      setSessionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setSessionToDelete(null);
  };

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && <div className="sidebar-overlay active" onClick={onClose}></div>}

      {/* 侧边栏 */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h2>律友</h2>
          </div>
          <button className="close-sidebar" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="sidebar-content">
          <button className="new-chat-button" onClick={handleNewChat}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            新对话
          </button>

          <div className="chat-history">
            <h3>聊天记录</h3>
            {loading ? (
              <div className="loading-indicator">加载中...</div>
            ) : chatHistory.length === 0 ? (
              <div className="empty-history">暂无聊天记录</div>
            ) : (
              <div className="history-list">
                {chatHistory.map((item) => (
                  <div
                    key={item.session_id}
                    className="history-item"
                    onClick={() => handleChatClick(item.session_id)}
                  >
                    <h4 className="history-item-title">{item.title}</h4>
                    <div className="history-item-actions">
                      <button 
                        onClick={(e) => handleDeleteChat(item.session_id, e)}
                        title="删除对话"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        title="删除对话"
        message="确定要删除此对话吗？"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
};

export default Sidebar;
