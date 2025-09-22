import React, { useState } from 'react';

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
  preview: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  // 模拟聊天历史数据
  const [chatHistory] = useState<ChatHistoryItem[]>([
    {
      id: '1',
      title: '劳动合同审查',
      date: '2023-06-15',
      preview: '审查了劳动合同中的竞业限制条款，建议修改...'
    },
    {
      id: '2',
      title: '供应商催款函',
      date: '2023-06-14',
      preview: '根据欠款情况生成了催款函，已发送至供应商...'
    },
    {
      id: '3',
      title: '买卖合同纠纷分析',
      date: '2023-06-12',
      preview: '分析了买卖合同纠纷的关键点，提供了法律建议...'
    },
    {
      id: '4',
      title: '租赁合同审查',
      date: '2023-06-10',
      preview: '审查了租赁合同的各项条款，指出了潜在风险...'
    },
    {
      id: '5',
      title: '知识产权咨询',
      date: '2023-06-08',
      preview: '关于商标注册和专利申请的专业建议...'
    },
    {
      id: '6',
      title: '公司法务咨询',
      date: '2023-06-05',
      preview: '关于公司设立和治理结构的问题解答...'
    }
  ]);

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
          <button className="new-chat-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            新对话
          </button>

          <div className="chat-history">
            <h3>聊天记录</h3>
            <div className="history-list">
              {chatHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-item-header">
                    <span className="history-item-date">{item.date}</span>
                  </div>
                  <h4 className="history-item-title">{item.title}</h4>
                  <p className="history-item-preview">{item.preview}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
