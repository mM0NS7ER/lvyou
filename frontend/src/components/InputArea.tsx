import React, { useState, KeyboardEvent, useRef, ChangeEvent, useCallback, useMemo } from 'react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File; // 添加可选的file属性
}

interface InputAreaProps {
  onSendMessage: (message: string, files?: UploadedFile[]) => void;
  isLoading?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClearMessage?: () => void;
  disabled?: boolean;
}

// 文件类型图标组件
const FileIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 24 }) => {
  // 基础文档图标
  const BaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );

  // PDF图标组件 - 使用导入的SVG图标d
  const PdfIcon = ({ size = 24 }: { size?: number }) => (
    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="icon" width="200" height="200">
  <path d="M192 384h640a42.666667 42.666667 0 0 1 42.666667 42.666667v362.666666a42.666667 42.666667 0 0 1-42.666667 42.666667H192v106.666667a21.333333 21.333333 0 0 0 21.333333 21.333333h725.333334a21.333333 21.333333 0 0 0 21.333333-21.333333V308.821333L949.909333 298.666667h-126.528A98.048 98.048 0 0 1 725.333333 200.618667V72.661333L716.714667 64H213.333333a21.333333 21.333333 0 0 0-21.333333 21.333333v298.666667zM128 832H42.666667a42.666667 42.666667 0 0 1-42.666667-42.666667V426.666667a42.666667 42.666667 0 0 1 42.666667-42.666667h85.333333V85.333333a85.333333 85.333333 0 0 1 85.333333-85.333333h530.026667L1024 282.453333V938.666667a85.333333 85.333333 0 0 1-85.333333 85.333333H213.333333a85.333333 85.333333 0 0 1-85.333333-85.333333v-106.666667zM88.469333 472.490667V746.666667h44.928v-105.216h67.968c66.816 0 100.224-28.416 100.224-84.864 0-56.064-33.408-84.096-99.456-84.096H88.469333z m44.928 38.4h65.28c19.584 0 34.176 3.456 43.392 10.752 9.216 6.912 14.208 18.432 14.208 34.944 0 16.512-4.608 28.416-13.824 35.712-9.216 6.912-23.808 10.752-43.776 10.752h-65.28v-92.16z m206.592-38.4V746.666667h100.224c44.544 0 77.952-12.288 100.992-36.864 21.888-23.424 33.024-56.832 33.024-100.224 0-43.776-11.136-77.184-33.024-100.224-23.04-24.576-56.448-36.864-100.992-36.864h-100.224z m44.928 38.4h46.848c34.176 0 59.136 7.68 74.88 23.424 15.36 15.36 23.04 40.704 23.04 75.264 0 33.792-7.68 58.752-23.04 74.88-15.744 15.744-40.704 23.808-74.88 23.808h-46.848v-197.376z m231.552-38.4V746.666667h44.928v-121.344h134.016v-38.4h-134.016v-76.032h142.08v-38.4h-187.008z" fill="#EA4318" />
</svg>

  );

  // DOCX文档图标组件
  const WordIcon = ({ size = 24 }: { size?: number }) => (
    <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <path d="M743.36 0L1024 282.453333V938.666667a85.333333 85.333333 0 0 1-85.333333 85.333333H213.333333a85.333333 85.333333 0 0 1-85.333333-85.333333v-106.666667H42.666667a42.666667 42.666667 0 0 1-42.666667-42.666667V426.666667a42.666667 42.666667 0 0 1 42.666667-42.666667h85.333333V85.333333a85.333333 85.333333 0 0 1 85.333333-85.333333h530.026667z m-26.645333 64H213.333333a21.333333 21.333333 0 0 0-21.333333 21.333333v298.666667h640a42.666667 42.666667 0 0 1 42.666667 42.666667v362.666666a42.666667 42.666667 0 0 1-42.666667 42.666667H192v106.666667a21.333333 21.333333 0 0 0 21.333333 21.333333h725.333334a21.333333 21.333333 0 0 0 21.333333-21.333333V308.821333L949.909333 298.666667h-126.528A98.048 98.048 0 0 1 725.333333 200.618667V72.682667L716.714667 64z" fill="#3878FF"></path>
      <path d="M58.474667 472.490667h70.570666c31.36 0 54.869333 12.288 71.104 36.864 15.402667 23.04 23.253333 56.448 23.253334 100.224 0 43.392-7.850667 76.8-23.253334 100.224C183.936 734.378667 160.405333 746.666667 129.045333 746.666667H58.453333V472.490667z m31.637333 38.4V708.266667H123.093333c24.064 0 41.642667-8.064 52.714667-23.808 10.816-16.128 16.213333-41.088 16.213333-74.88 0-34.56-5.397333-59.904-16.213333-75.264-11.093333-15.744-28.650667-23.424-52.714667-23.424H90.112z m248.746667-43.776c29.44 0 52.693333 13.44 69.738666 40.704 16.213333 25.728 24.32 59.904 24.32 102.144 0 42.24-8.106667 76.032-24.32 101.76-17.024 26.88-40.277333 40.32-69.76 40.32-29.738667 0-52.992-13.824-69.76-40.704-16.213333-26.112-24.042667-59.904-24.042666-101.376 0-41.856 7.829333-75.648 24.042666-101.76 16.768-27.648 40.021333-41.088 69.76-41.088z m0 39.552c-20.032 0-35.434667 9.6-46.506667 28.8-10.56 18.432-15.701333 43.008-15.701333 74.496 0 31.104 5.141333 55.68 15.68 74.112 10.816 18.816 26.496 28.416 46.506666 28.416 20.010667 0 35.413333-9.216 46.229334-27.264 10.56-18.048 15.957333-43.008 15.957333-75.264s-5.397333-57.6-15.957333-76.032c-10.816-18.432-26.218667-27.264-46.229334-27.264z m207.616-39.552c22.72 0 41.642667 8.448 56.234666 25.344 14.08 16.128 22.442667 38.4 25.429334 66.048h-30.826667c-3.242667-18.048-9.194667-31.104-18.133333-39.552-8.64-8.448-19.712-12.288-33.237334-12.288-20.266667 0-35.413333 9.6-45.696 29.568-9.450667 17.664-14.058667 42.24-14.058666 73.728 0 32.256 4.608 57.216 13.781333 74.496 10.026667 18.432 25.685333 28.032 46.784 28.032 13.781333 0 25.152-4.992 33.792-14.208 9.194667-10.368 15.68-26.112 19.477333-46.848h30.805334c-4.309333 32.256-14.314667 57.216-30.272 75.264-14.869333 16.896-32.725333 25.344-53.546667 25.344-32.149333 0-56.213333-14.592-71.893333-43.008-13.802667-24.576-20.565333-57.6-20.565334-99.072 0-40.704 7.04-74.112 21.376-99.456 16.213333-29.184 39.744-43.392 70.549334-43.392z m100.842666 5.376h38.677334l45.418666 96.768 45.418667-96.768h38.656l-65.152 132.48L819.818667 746.666667h-38.656l-49.749334-105.984L681.664 746.666667H642.986667l68.928-141.696-64.618667-132.48z" fill="#FFFFFF"></path>
    </svg>)
  // 文本文件图标组件
  const TextIcon = ({ size = 24 }: { size?: number }) => (
    <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <path d="M192 384h640a42.666667 42.666667 0 0 1 42.666667 42.666667v362.666666a42.666667 42.666667 0 0 1-42.666667 42.666667H192v106.666667a21.333333 21.333333 0 0 0 21.333333 21.333333h725.333334a21.333333 21.333333 0 0 0 21.333333-21.333333V308.821333L949.909333 298.666667h-126.528A98.048 98.048 0 0 1 725.333333 200.618667V72.661333L716.714667 64H213.333333a21.333333 21.333333 0 0 0-21.333333 21.333333v298.666667zM128 832H42.666667a42.666667 42.666667 0 0 1-42.666667-42.666667V426.666667a42.666667 42.666667 0 0 1 42.666667-42.666667h85.333333V85.333333a85.333333 85.333333 0 0 1 85.333333-85.333333h530.026667L1024 282.453333V938.666667a85.333333 85.333333 0 0 1-85.333333 85.333333H213.333333a85.333333 85.333333 0 0 1-85.333333-85.333333v-106.666667zM98.624 472.490667v38.4h85.994667V746.666667h43.008V510.890667h86.016v-38.4H98.602667z m228.245333 0l87.850667 132.48L320.981333 746.666667h52.565334l67.626666-105.984L508.8 746.666667h52.565333l-94.464-141.696 88.576-132.48h-52.544l-61.76 96.768-61.738666-96.768h-52.565334z m241.856 0v38.4h85.994667V746.666667h43.008V510.890667h86.016v-38.4h-215.04z" fill="#55D7E0" />
    </svg>
  )

  // 图片文件图标
  const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  );


  // 根据文件类型返回不同的图标
  if (type === 'application/pdf') {
    return <PdfIcon size={size} />;
  } else if (type.includes('word') || type === 'application/msword' || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return <WordIcon size={size} />;
  } else if (type.includes('text') || type === 'text/plain') {
    return <TextIcon size={size} />;
  } else if (type.startsWith('image/')) {
    return <ImageIcon />;
  }
  return <BaseIcon />;
};

// 图片预览组件
const ImagePreview: React.FC<{ file: File; name: string }> = ({ file, name }) => {
  const imageUrl = URL.createObjectURL(file);

  return (
    <div className="file-preview-image-container">
      <img
        src={imageUrl}
        alt={name}
        className="file-preview-image"
        onLoad={() => URL.revokeObjectURL(imageUrl)} // 图片加载后释放URL
      />
    </div>
  );
};

// 文件预览项组件
const FilePreviewItem: React.FC<{
  file: UploadedFile;
  onRemove: (id: string) => void;
}> = ({ file, onRemove }) => {
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const previewContent = useMemo(() => {
    if (file.type.startsWith('image/') && file.file) {
      return <ImagePreview file={file.file} name={file.name} />;
    }
    return (
      <div className="file-preview-icon">
        <FileIcon type={file.type} />
      </div>
    );
  }, [file]);

  return (
    <div className="file-preview-item">
      {previewContent}
      <div className="file-preview-info">
        <div className="file-preview-name" title={file.name}>
          {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
        </div>
        <div className="file-preview-size">{formatFileSize(file.size)}</div>
      </div>
      <button
        className="file-preview-remove"
        onClick={() => onRemove(file.id)}
        title="删除文件"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  isLoading = false,
  value,
  onChange,
  onClearMessage,
  disabled = false
}) => {
  const [internalMessage, setInternalMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用传入的value或内部状态
  const message = value !== undefined ? value : internalMessage;

  // 处理键盘事件
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    onSendMessage(message, uploadedFiles);
  }
}, [message, uploadedFiles, onSendMessage]);


  // 处理文本变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e);
    } else {
      setInternalMessage(e.target.value);
    }
  }, [onChange]);

  // 发送消息
  const handleSendMessage = useCallback(() => {
    if (message.trim() || uploadedFiles.length > 0) {
      try {
        onSendMessage(message, uploadedFiles);
        // 立即清空输入框和文件
        if (value === undefined) {
          setInternalMessage('');
        } else if (onClearMessage) {
          onClearMessage();
        }
        setUploadedFiles([]);
      } catch (error) {
        console.error('发送消息失败:', error);
        // 可以在这里添加错误提示，例如使用 toast 通知
      }
    }
  }, [message, uploadedFiles, onSendMessage, value, onClearMessage]);

  // 处理文件选择
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files).map(file => ({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
          type: file.type,
          file: file // 保存实际的File对象以便预览
        }));

        // 更新文件列表
        setUploadedFiles(prev => [...prev, ...newFiles]);

        // 重置文件输入，允许再次选择相同文件
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('文件处理失败:', error);
      // 可以在这里添加错误提示，例如使用 toast 通知
    }
  }, []);

  // 触发文件选择
  const triggerFileSelect = useCallback(() => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // 删除文件
  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  return (
    <section className="input-section">
      {/* 文件预览区域 */}
      {uploadedFiles.length > 0 && (
        <div className="file-preview-container">
          <div className="file-preview-list">
            {uploadedFiles.map(file => (
              <FilePreviewItem 
                key={file.id} 
                file={file} 
                onRemove={removeFile} 
              />
            ))}
          </div>
          <div className="file-preview-actions">
            <button 
              className="add-more-files" 
              onClick={triggerFileSelect}
              disabled={disabled}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              添加更多文件
            </button>
          </div>
        </div>
      )}

      <div className="input-container">
        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="输入法律问题，剩下的交给律友"
          rows={3}
          disabled={disabled || isLoading}
        />
        <div className="input-buttons">
          <button 
            className="upload-button" 
            onClick={triggerFileSelect}
            disabled={disabled || isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </button>
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={disabled || isLoading || (!message.trim() && uploadedFiles.length === 0)}
          >
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

      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        style={{ display: 'none' }}
        disabled={disabled || isLoading}
      />
    </section>
  );
};

export default InputArea;
