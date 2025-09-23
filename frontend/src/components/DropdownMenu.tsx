import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuItem {
  id: string;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  trigger, 
  items, 
  position = 'bottom-left' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleItemClick = (item: DropdownMenuItem) => {
    setIsOpen(false);
    item.onClick();
  };

  return (
    <div className="dropdown-menu-container" ref={dropdownRef}>
      <div 
        className="dropdown-menu-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </div>

      {isOpen && (
        <div className={`dropdown-menu dropdown-menu-${position}`}>
          {items.map((item) => (
            <button
              key={item.id}
              className={`dropdown-menu-item ${item.danger ? 'danger' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && <span className="dropdown-menu-item-icon">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
