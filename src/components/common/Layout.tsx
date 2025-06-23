// components/common/Layout.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', name: '대시보드', icon: '📊' },
    { path: '/company', name: '업체정보 등록', icon: '🏢' },
    { path: '/hr', name: '휴먼리소스 등록', icon: '👥' },
    { path: '/project', name: '프로젝트 생성', icon: '📋' }
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // 디버깅용 로그
  console.log('📍 Current pathname:', location.pathname);

  return (
    <div className="layout">
      <header className="header">
        <div className="header-left">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="header-title">ERP Information Module</h1>
        </div>
        <div className="header-right">
          <span className="user-info">관리자</span>
        </div>
      </header>

      <div className="main-container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <ul className="nav-list">
              {menuItems.map((item) => (
                <li key={item.path} className="nav-item">
                  <Link 
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {sidebarOpen && <span className="nav-text">{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;