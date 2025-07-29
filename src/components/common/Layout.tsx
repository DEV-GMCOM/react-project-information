// components/common/Layout.tsx
import React, { useState } from 'react';
import {Link, Route, useLocation} from 'react-router-dom';
import '../../styles/Layout.css';
import ProjectKickoffChecklist from "@/pages/project/ProjectKickoffChecklist.tsx";

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

  // 기존 시스템 메뉴 (윗부분)
  const legacyMenuItems: MenuItem[] = [
    {
      path: '/dashboard',
      name: '대시보드',
      icon: '📊'
    },
    {
      path: '/information',
      name: '[입력폼 샘플] 정보수집',
      icon: '📋',
      subMenus: [
        { path: '/info-management/project', name: '[입력폼 샘플] 프로젝트 정보수집' }
        ,{ path: '/info-management/advertiser', name: '[입력폼 샘플] 광고주(담당자) 프로파일' }
      ]
    },
    {
      path: '/project-evaluation',
      name: '[입력폼 샘플] 프로젝트 평가 리스트',
      icon: '✅'
    },
    {
      path: '/project-profile',
      name: '[입력폼 샘플] 프로젝트 Profile 작성',
      icon: '📝'
    },
    {
      path: '/project-kickoff',
      name: '[입력폼 샘플] 프로젝트 착수서 작성',
      icon: '🚀'
    },
    {
      path: '/pt-checklist',
      name: '[입력폼 샘플] 제안서 PT 체크리스트',
      icon: '✅'
    },
    {
      path: '/pt-postmortem',
      name: '[입력폼 샘플] PT postmortem',
      icon: '🔍'
    },
    {
      path: '/project-postmortem',
      name: '[입력폼 샘플] Project postmortem',
      icon: '📊'
    }
  ];

  // 신규 생성 메뉴 (아래부분)
  const newMenuItems: MenuItem[] = [
    {
      path: '/company',
      name: '업체 관리',
      icon: '🏢',
      subMenus: [
        { path: '/company', name: '업체 목록' },
        { path: '/company/new', name: '업체 등록' },
        { path: '/company/regist', name: '업체 신규등록' },
        { path: '/company/information', name: '[입력폼 샘플] 프로젝트 정보수집' },
        { path: '/company/profile', name: '[입력폼 샘플] 광고주(담당자) 프로파일' }
      ]
    },
    {
      path: '/hr',
      name: '인적자원 관리',
      icon: '👥',
      subMenus: [
        { path: '/hr', name: '직원 목록' },
        { path: '/hr/new', name: '직원 등록' }
      ]
    },
    {
      path: '/project',
      name: '프로젝트 관리',
      icon: '📁',
      subMenus: [
        { path: '/project', name: '프로젝트 목록' },
        { path: '/project/new', name: '프로젝트 등록' },
        { path: '/project/regist', name: '프로젝트 신규등록' },
        { path: '/project/information', name: '[입력폼 샘플] 프로젝트 정보수집' }

        ,{ path: '/project/kickoff-checklist', name: '[입력폼 샘플] 프로젝트 평가 체크리스트' }
        ,{ path: '/project/profile', name: '[입력폼 샘플] 프로젝트 프로파일' }
        ,{ path: '/project/kickoff', name: '[입력폼 샘플] 프로젝트 착수서' }
        ,{ path: '/project/pt-checklist', name: '[입력폼 샘플] PT 준비 체크리스트' }
        ,{ path: '/project/postmortem-pt', name: '[입력폼 샘플] PT 사후분석' }
        ,{ path: '/project/postmortem-project', name: '[입력폼 샘플] 프로젝트 실행 결과 사후분석' }
      ]
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

  // 메뉴 항목 렌더링 함수
  const renderMenuItem = (item: MenuItem) => (
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
  );

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
              {/* 윗부분 - 기존 시스템 메뉴 */}
              <div className="nav-section nav-section-top">
                <ul className="nav-list">
                  {legacyMenuItems.map(renderMenuItem)}
                </ul>
              </div>

              {/* 구분선 */}
              <div className="nav-divider"></div>

              {/*/!* 아래부분 - 신규 생성 메뉴 *!/*/}
              {/*<div className="nav-section nav-section-bottom">*/}
              {/*  <ul className="nav-list">*/}
              {/*    {newMenuItems.map(renderMenuItem)}*/}
              {/*  </ul>*/}
              {/*</div>*/}
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