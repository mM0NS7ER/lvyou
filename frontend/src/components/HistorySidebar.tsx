import React, { useState, useEffect } from 'react';
import { getChatHistory, getUserSessions } from '../services/apiService';

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  type: string;
  preview: string;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSessions, setUserSessions] = useState<HistoryItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // 获取用户会话
  useEffect(() => {
    const fetchUserSessions = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await getUserSessions(userId);
        // 将会话数据转换为历史记录项格式
        const sessions: HistoryItem[] = response.sessions.map((session: any) => ({
          id: session.session_id,
          title: session.last_message.substring(0, 30) + (session.last_message.length > 30 ? '...' : ''),
          date: new Date(session.timestamp).toLocaleDateString(),
          type: '会话',
          preview: session.last_message
        }));

        setUserSessions(sessions);
        // 如果没有活动会话，设置第一个为活动会话
        if (!activeSessionId && sessions.length > 0) {
          setActiveSessionId(sessions[0].id);
        }
      } catch (error) {
        console.error('获取用户会话失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSessions();
  }, [activeSessionId]);

  // 获取活动会话的历史记录
  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeSessionId) return;

      try {
        setLoading(true);
        const userId = localStorage.getItem('userId');
        const response = await getChatHistory(activeSessionId, userId);

        // 将消息数据转换为历史记录项格式
        const items: HistoryItem[] = response.messages.map((msg: any) => ({
          id: msg._id,
          title: msg.role === 'user' ? '用户提问' : 'AI回复',
          date: new Date(msg.timestamp).toLocaleString(),
          type: msg.role === 'user' ? '用户消息' : 'AI回复',
          preview: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '')
        }));

        setHistoryItems(items);
      } catch (error) {
        console.error('获取历史记录失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [activeSessionId]);

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && <div className="sidebar-overlay active" onClick={onClose}></div>}

      {/* 侧边栏 */}
      <div className={`history-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>历史记录</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 会话列表 */}
        <div className="session-list">
          <h4>会话列表</h4>
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <ul>
              {userSessions.map((session) => (
                <li
                  key={session.id}
                  className={session.id === activeSessionId ? 'active' : ''}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <div className="session-item-header">
                    <span className="session-item-date">{session.date}</span>
                  </div>
                  <h5 className="session-item-title">{session.title}</h5>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 历史记录列表 */}
        <div className="history-list">
          <h4>历史记录</h4>
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <>
              {historyItems.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-item-header">
                    <span className="history-item-type">{item.type}</span>
                    <span className="history-item-date">{item.date}</span>
                  </div>
                  <h4 className="history-item-title">{item.title}</h4>
                  <p className="history-item-preview">{item.preview}</p>
                </div>
              ))}
              {historyItems.length === 0 && !loading && (
                <div className="no-data">暂无历史记录</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;
