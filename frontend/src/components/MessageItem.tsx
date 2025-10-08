import React from 'react';
import { ChatMessage } from '../hooks/useChat';

interface MessageItemProps {
  message: ChatMessage;
  onCopy: (content: string) => void;
  isStreaming: boolean;
  formatTime: (timestamp: string) => string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onCopy, isStreaming, formatTime }) => {
  // 判断是否是纯文件消息（只有文件，没有文本内容）
  const isFileOnlyMessage = message.role === 'user' && 
                          ((!message.content || message.content.trim() === '') || message.content === '发送了文件') && 
                          message.files && 
                          message.files.length > 0;

  return (
    <div
      key={message._id}
      className={`message ${message.role} ${isStreaming ? 'streaming' : ''} ${isFileOnlyMessage ? 'file-only' : ''}`}
    >
      <div className="message-content">
        {/* 对于纯文件消息，不显示文本内容 */}
        {!isFileOnlyMessage && message.content && <p>{message.content}</p>}

        {/* 显示文件 */}
        {(message.files && message.files.length > 0) && (
          <div className={`message-files ${isFileOnlyMessage ? 'file-only-files' : ''}`}>
            {message.files.map((file, index) => (
              <div key={file.id || index} className="message-file">
                {file.type && file.type.startsWith('image/') ? (
                  // 图片显示缩略图
                  <div className="file-preview-image-container">
                    <img
                      src={file.preview_url || file.path}
                      alt={file.name}
                      className="file-preview-image"
                    />
                  </div>
                ) : (
                  // 文档显示下载链接
                  <div className="file-preview-icon">
                    <a href={file.path} download={file.name} className="file-download-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <span>{file.name}</span>
                    </a>
                  </div>
                )}
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {isStreaming && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
      {message.role === 'assistant' && !isStreaming && (
        <div className="message-actions">
          <button onClick={() => onCopy(message.content)}>
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
  );
};

export default MessageItem;
