// components/common/Layout.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

interface SubMenuItem {
  path: string;
  name: string;
}

interface MenuItem {
  path: string;
  name: string;
  icon: string;
  subMenus?: SubMenuItem[];
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      path: '/dashboard',
      name: '대시보드',
      icon: '📊'
    },
    {
      path: '/information',
      name: '정보수집',
      icon: '📋',
      subMenus: [
        { path: '/information/bidding', name: '입찰' },
        { path: '/information/advertiser', name: '광고주' }
      ]
    },
    {
      path: '/project-profile',
      name: '프로젝트 기본 Profile 작성',
      icon: '📝'
    },
    {
      path: '/project-kickoff',
      name: '프로젝트 착수서 작성',
      icon: '🚀'
    },
    {
      path: '/pt-checklist',
      name: '제안서 PT 체크리스트',
      icon: '✅'
    },
    {
      path: '/pt-postmortem',
      name: 'PT postmortem',
      icon: '🔍'
    },
    {
      path: '/project-postmortem',
      name: '프로젝트 결과 postmortem',
      icon: '📊'
    }
  ];

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev =>
        prev.includes(path)
            ? prev.filter(p => p !== path)
            : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const isSubMenuActive = (parentPath: string, subPath: string) => {
    return location.pathname === subPath;
  };

  const hasActiveSubMenu = (item: MenuItem) => {
    if (!item.subMenus) return false;
    return item.subMenus.some(subMenu => location.pathname === subMenu.path);
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
                      {item.subMenus ? (
                          // 서브메뉴가 있는 경우
                          <>
                            <button
                                className={`nav-link nav-button ${
                                    hasActiveSubMenu(item) ? 'active' : ''
                                }`}
                                onClick={() => toggleMenu(item.path)}
                            >
                              <span className="nav-icon">{item.icon}</span>
                              {sidebarOpen && (
                                  <>
                                    <span className="nav-text">{item.name}</span>
                                    <span className={`nav-arrow ${
                                        expandedMenus.includes(item.path) ? 'expanded' : ''
                                    }`}>
                              ▼
                            </span>
                                  </>
                              )}
                            </button>
                            {sidebarOpen && expandedMenus.includes(item.path) && (
                                <ul className="sub-nav-list">
                                  {item.subMenus.map((subItem) => (
                                      <li key={subItem.path} className="sub-nav-item">
                                        <Link
                                            to={subItem.path}
                                            className={`sub-nav-link ${
                                                isSubMenuActive(item.path, subItem.path) ? 'active' : ''
                                            }`}
                                        >
                                          <span className="sub-nav-text">{subItem.name}</span>
                                        </Link>
                                      </li>
                                  ))}
                                </ul>
                            )}
                          </>
                      ) : (
                          // 서브메뉴가 없는 경우
                          <Link
                              to={item.path}
                              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                          >
                            <span className="nav-icon">{item.icon}</span>
                            {sidebarOpen && <span className="nav-text">{item.name}</span>}
                          </Link>
                      )}
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