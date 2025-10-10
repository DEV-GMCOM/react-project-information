// src/components/common/Layout.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../../styles/Layout.css';
import { useAuth } from '../../contexts/AuthContext';

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
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const headerTitle = import.meta.env.VITE_APP_TITLE || 'GMCOM Information System';


    // 기본 메뉴 항목들
    const mainMenuItems: MenuItem[] = [
        // {
        //     path: '/dashboard',
        //     name: '대시보드',
        //     icon: '📊'
        // },
        {
            path: '/information',
            name: '0. 기본정보',
            icon: '📋',
            subMenus: [
                { path: '/info-management/advertiser', name: '기업 / 광고주 ( 담당자 )' },
                { path: '/info-management/project', name: '프로젝트 프로파일' }
            ]
        },
        // {
        //     path: '/project-evaluation',
        //     name: '1. 프로젝트 자체평가',
        //     icon: '✅'
        // },
        // {
        //     path: '/project-profile',
        //     name: '2. 프로젝트 프로파일',
        //     icon: '📝'
        // },
        {
            path: '/project-kickoff',
            name: '1. 프로젝트 착수서',
            icon: '🚀'
        },
        {
            path: '/pt-checklist',
            name: '2. PT 자체평가',
            icon: '✅'
        },
        {
            path: '/pt-postmortem',
            name: '3. PT 결과분석',
            icon: '🔍'
        },
        {
            path: '/project-postmortem',
            name: '4. 프로젝트 결과분석',
            icon: '📊'
        },
    ];

    // 관리자 메뉴 항목들
    const adminMenuItems: MenuItem[] = [
        {
            path: '/admin/permissions/policies',
            name: '권한 관리',
            icon: '🚫',
            subMenus: [
                { path: '/admin/permissions/policies', name: '정책 관리' },     //
                { path: '/admin/permissions/roles', name: '역할 관리' },        // 직급별, 부서별, 개인별
                { path: '/admin/permissions/pages', name: '페이지 관리' },       //
                { path: '/admin/permissions/restrictions', name: '한정 관리' }, // 시간별, 외부접근별
            ]
        },


        // {
        //     path: '/admin/users',
        //     name: '사용자 관리',
        //     icon: '👤',
        //     subMenus: [
        //         { path: '/admin/users', name: '사용자 목록' },
        //         { path: '/admin/users/permissions', name: '권한 관리' },
        //         { path: '/admin/users/roles', name: '역할 관리' }
        //     ]
        // },
        // {
        //     path: '/company',
        //     name: '업체 관리',
        //     icon: '🏢',
        //     subMenus: [
        //         { path: '/company', name: '업체 목록' },
        //         { path: '/company/new', name: '업체 등록' },
        //         { path: '/company/regist', name: '업체 신규등록' },
        //         { path: '/company/information', name: '[입력폼 샘플] 프로젝트 정보수집' },
        //         { path: '/company/profile', name: '[입력폼 샘플] 광고주(담당자) 프로파일' }
        //     ]
        // },
        // {
        //     path: '/hr',
        //     name: '인적자원 관리',
        //     icon: '👥',
        //     subMenus: [
        //         { path: '/hr', name: '직원 목록' },
        //         { path: '/hr/new', name: '직원 등록' }
        //     ]
        // },
        // {
        //     path: '/project',
        //     name: '프로젝트 관리',
        //     icon: '📁',
        //     subMenus: [
        //         { path: '/project', name: '프로젝트 목록' },
        //         { path: '/project/new', name: '프로젝트 등록' },
        //         { path: '/project/regist', name: '프로젝트 신규등록' },
        //         { path: '/project/information', name: '[입력폼 샘플] 프로젝트 정보수집' },
        //         { path: '/project/kickoff-checklist', name: '[입력폼 샘플] 프로젝트 평가 체크리스트' },
        //         { path: '/project/profile', name: '[입력폼 샘플] 프로젝트 프로파일' },
        //         { path: '/project/kickoff', name: '[입력폼 샘플] 프로젝트 착수서' },
        //         { path: '/project/pt-checklist', name: '[입력폼 샘플] PT 준비 체크리스트' },
        //         { path: '/project/postmortem-pt', name: '[입력폼 샘플] PT 사후분석' },
        //         { path: '/project/postmortem-project', name: '[입력폼 샘플] 프로젝트 실행 결과 사후분석' }
        //     ]
        // },
        // {
        //     path: '/admin/system',
        //     name: '시스템 관리',
        //     icon: '⚙️',
        //     subMenus: [
        //         { path: '/admin/system/settings', name: '시스템 설정' },
        //         { path: '/admin/system/logs', name: '시스템 로그' },
        //         { path: '/admin/system/backup', name: '백업 관리' }
        //     ]
        // },
        // {
        //     path: '/admin/database',
        //     name: '데이터베이스 관리',
        //     icon: '🗄️',
        //     subMenus: [
        //         { path: '/admin/database/maintenance', name: '데이터베이스 유지보수' },
        //         { path: '/admin/database/migration', name: '데이터 마이그레이션' },
        //         { path: '/admin/database/monitoring', name: '성능 모니터링' }
        //     ]
        // },
        // {
        //     path: '/admin/analytics',
        //     name: '분석 및 리포트',
        //     icon: '📈',
        //     subMenus: [
        //         { path: '/admin/analytics/usage', name: '사용량 분석' },
        //         { path: '/admin/analytics/performance', name: '성능 분석' },
        //         { path: '/admin/analytics/reports', name: '통계 리포트' }
        //     ]
        // }
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

    // 로그아웃 처리
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    };

    // 사용자 정보 클릭 시 실행될 핸들러
    const handleUserInfoClick = () => {
        navigate('/profile/change-password');
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
                    {/*<h1 className="header-title">GMCOM Information System</h1>*/}
                    <h1 className="header-title">{headerTitle}</h1>
                </div>
                <div className="header-right">
                    {user ? (
                        <>
                            {/*<span className="user-info">*/}
                            {/*    {user.emp_name}*/}
                            {/*    {user.position && ` (${user.position})`}*/}
                            {/*    {user.team && ` - ${user.team}`}*/}
                            {/*</span>*/}
                            {/* user-info 영역에 onClick 핸들러와 스타일링을 위한 className 추가 */}
                            <div className="user-info user-info-clickable" onClick={handleUserInfoClick}>
    <span>
        {user?.emp_name}
        {user?.position && ` (${user.position})`}
        {user?.team && ` - ${user.team}`}
    </span>
                            </div>
                            <button
                                className="logout-btn"
                                onClick={handleLogout}
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <span className="user-info">로그인 필요</span>
                    )}
                </div>
            </header>

            <div className="main-container">
                <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                    <nav className="sidebar-nav">
                        {/* 메인 메뉴 섹션 */}
                        <div className="nav-section nav-section-main">
                            <ul className="nav-list">
                                {mainMenuItems.map(renderMenuItem)}
                            </ul>
                        </div>

                        {/* 구분선 */}
                        <div className="nav-divider"></div>

                        {/*/!* 관리자 메뉴 섹션 *!/*/}
                        {/*<div className="nav-section nav-section-admin">*/}
                        {/*    {sidebarOpen && (*/}
                        {/*        <div className="section-header">*/}
                        {/*            <div className="section-title">관리자 메뉴</div>*/}
                        {/*        </div>*/}
                        {/*    )}*/}
                        {/*    <ul className="nav-list">*/}
                        {/*        {adminMenuItems.map(renderMenuItem)}*/}
                        {/*    </ul>*/}
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