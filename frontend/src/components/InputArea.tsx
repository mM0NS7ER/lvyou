import React, { useState } from 'react';

interface InputAreaProps {
  onSend: (message: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <div className="input-area">
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="请描述您的法律问题或需求，我将为您提供专业解答..."
            rows={3}
          />
          <button type="submit" className="send-button">
            发送
          </button>
        </div>
      </form>
      <div className="quick-actions">
        <span className="quick-action-label">快速操作：</span>
        <button className="quick-action" onClick={() => onSend("请帮我审查一份合同")}>
          合同审查
        </button>
        <button className="quick-action" onClick={() => onSend("帮我起草一份催款函")}>
          起草催款函
        </button>
        <button className="quick-action" onClick={() => onSend("生成一份法律分析报告")}>
          生成报告
        </button>
      </div>
    </div>
  );
};

export default InputArea;
