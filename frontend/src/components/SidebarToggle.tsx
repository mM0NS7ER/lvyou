import React from 'react';

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({ isOpen, onToggle }) => {
  return (
    <button 
      className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
      onClick={onToggle}
      aria-label="历史记录"
    >
      <div className="toggle-icon">
        <span className="toggle-line"></span>
        <span className="toggle-line"></span>
        <span className="toggle-line"></span>
      </div>
      <span className="toggle-text">历史记录</span>
    </button>
  );
};

export default SidebarToggle;
