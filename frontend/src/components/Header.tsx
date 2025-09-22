import React from 'react';

const Header = () => {
  return (
    <header className="app-header">
      <div className="logo-container">
        <div className="logo">
          {/* 这里可以放置Logo */}
          <span className="logo-text">律友</span>
        </div>
        <h1>AI法律助手</h1>
      </div>
      <p className="tagline">您的专业法律顾问，7×24小时在线服务</p>
    </header>
  );
};

export default Header;
