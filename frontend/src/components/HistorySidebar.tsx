import React, { useState } from 'react';

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
  // 模拟历史记录数据
  const [historyItems] = useState<HistoryItem[]>([
    {
      id: '1',
      title: '劳动合同审查',
      date: '2023-06-15',
      type: '合同文书',
      preview: '审查了劳动合同中的竞业限制条款，建议修改...'
    },
    {
      id: '2',
      title: '供应商催款函',
      date: '2023-06-14',
      type: '维权催收',
      preview: '根据欠款情况生成了催款函，已发送至供应商...'
    },
    {
      id: '3',
      title: '买卖合同纠纷分析',
      date: '2023-06-12',
      type: '咨询报告',
      preview: '分析了买卖合同纠纷的关键点，提供了法律建议...'
    },
    {
      id: '4',
      title: '租赁合同审查',
      date: '2023-06-10',
      type: '合同文书',
      preview: '审查了租赁合同的各项条款，指出了潜在风险...'
    }
  ]);

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

        <div className="history-list">
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
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;
