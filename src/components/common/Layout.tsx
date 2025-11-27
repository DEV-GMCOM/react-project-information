// src/components/common/Layout.tsx
import React, {useEffect, useState} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../../styles/Layout.css';
import { useAuth } from '../../contexts/AuthContext';
import NoticeModal from '../NoticeModal';
import HelpModal from '../HelpModal';
import { HelpProvider, useHelp } from '../../contexts/HelpContext';
import { usePermissions } from '../../hooks/usePermissions'; // usePermissions 훅 임포트

interface LayoutProps {
    children: React.ReactNode;
}

export interface NavSubMenuItem {
    path: string;
    name: string;
    permission?: string; // 하위 메뉴에도 권한 속성 추가
    isDev?: boolean; // 개발 메뉴 여부 플래그
}

export interface NavMenuItem {
    path: string;
    name: string;
    icon: string;
    subMenus?: NavSubMenuItem[];
    permission?: string; // 메뉴 아이템에 권한 속성 추가
    isDev?: boolean; // 개발 메뉴 여부 플래그
}

// 메뉴 데이터 정의
export const baseMainMenuItems: NavMenuItem[] = [
    {
        path: '/information',
        name: '기본정보',
        icon: '📋',
        permission: 'page:information',
        subMenus: [
            { path: '/info-management/advertiser', name: '기업 / 광고주 ( 담당자 )', permission: 'page:info-management_advertiser' },
            { path: '/info-management/project', name: '프로젝트 프로파일', permission: 'page:info-management_project' }
        ]
    },
    { path: '/project-kickoff', name: '프로젝트 착수서', icon: '🚀', permission: 'page:project-kickoff' },
    { path: '/pt-checklist', name: 'PT 전 체크', icon: '✅', permission: 'page:pt-checklist' },
    { path: '/pt-postmortem', name: 'PT 결과분석', icon: '🔍', permission: 'page:pt-postmortem' },
    { path: '/project-execution', name: '프로젝트 실행파일링', icon: '📁', permission: 'page:project-execution' },
    { path: '/project-postmortem', name: '프로젝트 결과분석', icon: '📊', permission: 'page:project-postmortem' },
    { path: '/working/meeting-minutes', name: '자동 회의록', icon: '🗒️', permission: 'page:working_meeting-minutes' },
    {
        path: '/admin/permission',
        name: '권한 관리',
        icon: '🚫️',
        permission: 'page:admin_permission',
    }
];

export const devMenuItems: NavMenuItem[] = [
    { path: '/hr/employee-management', name: '직원정보 관리', icon: '🧑‍💼', permission: 'page:hr_employee-management' },
    { path: '/working/fms', name: 'GMCOM 저장소', icon: '💾', permission: 'page:working_fms' },
    { path: '/working/clock-in-out', name: '출퇴근 체크', icon: '⏱️', permission: 'page:working_clock-in-out' },
    { path: '/sales/schedule', name: '영업스케쥴', icon: '📈', permission: 'page:sales_schedule' },
    { path: '/working/scheduling', name: '스케쥴링', icon: '📅', permission: 'page:working_scheduling' },
];

const adminMenuItems: NavMenuItem[] = []; // 현재 사용 안 함

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { hasPermission } = usePermissions(); // 권한 확인 훅 사용

    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [currentHelpContent, setCurrentHelpContent] = useState<{ pageName: string; content: React.ReactNode } | null>(null);
    const hideRestrictedUi = import.meta.env.VITE_HIDE_RESTRICTED_UI === 'true'; // prod-only safety flag

    // 현재 경로에 대한 권한 체크
    const checkCurrentPagePermission = () => {
        // 로그인, 프로필 등 권한 체크 제외 경로
        const excludedPaths = ['/login', '/profile/change-password', '/'];
        if (excludedPaths.some(path => location.pathname === path)) {
            return true;
        }

        // 메뉴 데이터에서 현재 경로의 권한 찾기
        const allMenus = [...baseMainMenuItems, ...devMenuItems];

        // 정확한 경로 매칭
        for (const menu of allMenus) {
            // 상위 메뉴 체크
            if (menu.path === location.pathname && menu.permission) {
                return hasPermission(menu.permission);
            }
            // 하위 메뉴 체크
            if (menu.subMenus) {
                const subMenu = menu.subMenus.find(sub => sub.path === location.pathname);
                if (subMenu && subMenu.permission) {
                    return hasPermission(subMenu.permission);
                }
            }
        }

        // 권한 설정이 없는 페이지는 기본 허용
        return true;
    };

    const hasPagePermission = checkCurrentPagePermission();

    const handleShowHelp = () => {
        setShowHelpModal(true);
    };
    const headerTitle = import.meta.env.VITE_APP_TITLE || 'GMCOM Information System';

    // Layout 내부에서 사용할 필터링된 메뉴
    const displayMainMenus = hideRestrictedUi
        ? baseMainMenuItems.filter(item => item.path !== '/working/meeting-minutes') // block experimental pages in prod
        : baseMainMenuItems;

    const displayDevMenus = hideRestrictedUi ? [] : devMenuItems;
    
    useEffect(() => {
        const allMenuItems = [...displayMainMenus, ...displayDevMenus, ...adminMenuItems]; // Display 메뉴들을 사용
        const activeParentMenu = allMenuItems.find(item =>
            item.subMenus?.some(subMenu => location.pathname === subMenu.path)
        );

        if (activeParentMenu && !expandedMenus.includes(activeParentMenu.path)) {
            setExpandedMenus(prev => [...prev, activeParentMenu.path]);
        }
    }, [location.pathname, displayMainMenus, displayDevMenus, adminMenuItems]); // 의존성 추가

    useEffect(() => {
        const shouldShowNotice = localStorage.getItem('show_notice_on_login');
        if (shouldShowNotice === 'true') {
            setShowNoticeModal(true);
            localStorage.removeItem('show_notice_on_login');
        }
    }, []);

    const filterMenuItems = (items: NavMenuItem[]): NavMenuItem[] => {
        return items.map(item => {
            // 상위 메뉴 자체에 대한 권한 확인
            if (item.permission && !hasPermission(item.permission)) {
                return null;
            }

            if (!item.subMenus) {
                return item;
            }

            const filteredSubMenus = item.subMenus.filter(subItem => {
                // 하위 메뉴에 권한 설정이 있으면 확인, 없으면 통과
                return !subItem.permission || hasPermission(subItem.permission);
            });

            if (filteredSubMenus.length === 0) {
                return null;
            }

            return { ...item, subMenus: filteredSubMenus };
        }).filter((item): item is NavMenuItem => item !== null);
    };

    const accessibleMainMenus = filterMenuItems(displayMainMenus);
    const accessibleDevMenus = filterMenuItems(displayDevMenus); // 개발 메뉴도 권한 필터링 적용

    const toggleMenu = (path: string) => {
        setExpandedMenus(prev =>
            prev.includes(path)
                ? prev.filter(p => p !== path)
                : [...prev, path]
        );
    };

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const isSubMenuActive = (subPath: string) => {
        return location.pathname === subPath;
    };

    const hasActiveSubMenu = (item: NavMenuItem) => {
        return item.subMenus?.some(subMenu => location.pathname === subMenu.path) ?? false;
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    };

    const handleUserInfoClick = () => {
        navigate('/profile/change-password');
    };

    const renderMenuItem = (item: NavMenuItem) => (
        <li key={item.path} className="nav-item">
            {item.subMenus ? (
                <>
                    <button
                        className={`nav-link nav-button ${hasActiveSubMenu(item) ? 'active' : ''}`}
                        onClick={() => toggleMenu(item.path)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {sidebarOpen && (
                            <>
                                <span className="nav-text">{item.name}</span>
                                <span className={`nav-arrow ${expandedMenus.includes(item.path) ? 'expanded' : ''}`}>▼</span>
                            </>
                        )}
                    </button>
                    {sidebarOpen && expandedMenus.includes(item.path) && (
                        <ul className="sub-nav-list">
                            {item.subMenus.map((subItem) => (
                                <li key={subItem.path} className="sub-nav-item">
                                    <Link
                                        to={subItem.path}
                                        className={`sub-nav-link ${isSubMenuActive(subItem.path) ? 'active' : ''}`}
                                    >
                                        <span className="sub-nav-text">{subItem.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            ) : (
                <Link to={item.path} className={`nav-link ${isActive(item.path) ? 'active' : ''}`}>
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
                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
                    <h1 className="header-title">{headerTitle}</h1>
                </div>
                <div className="header-right">
                    {user ? (
                        <>
                            <div className="user-info user-info-clickable" onClick={handleUserInfoClick}>
                                <span>
                                    {user?.emp_name}
                                    {user?.position && ` (${user.position})`}
                                    {user?.team && ` - ${user.team}`}
                                </span>
                            </div>
                            {!hideRestrictedUi && (
                                <>
                                    <button className="notice-btn" onClick={() => setShowNoticeModal(true)} title="공지사항">📢 공지</button>
                                    <button className="help-btn" onClick={handleShowHelp} title="도움말">❓ 도움말</button>
                                </>
                            )}
                            <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
                        </>
                    ) : (
                        <span className="user-info">로그인 필요</span>
                    )}
                </div>
            </header>

            <div className="main-container">
                <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                    <nav className="sidebar-nav">
                        <div className="nav-section nav-section-main">
                            <ul className="nav-list">
                                {accessibleMainMenus.map(renderMenuItem)}
                            </ul>
                        </div>
                        {accessibleDevMenus.length > 0 && ( // 권한 필터링 후 메뉴가 있을 때만 표시
                            <>
                                <div className="nav-divider"></div>
                                <div className="nav-section nav-section-admin">
                                    {sidebarOpen && <div className="section-header"><div className="section-title">개발 중인 항목</div></div>}
                                    <ul className="nav-list">
                                        {accessibleDevMenus.map(renderMenuItem)}
                                    </ul>
                                </div>
                            </>
                        )}
                    </nav>
                </aside>

                <main className="content">
                    {!hasPagePermission ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <h2>🚫 접근 권한이 없습니다</h2>
                            <p>이 페이지에 접근할 권한이 없습니다.</p>
                            <p style={{ color: '#999', marginTop: '1rem', fontSize: '0.9rem' }}>
                                현재 경로: <code>{location.pathname}</code>
                            </p>
                            <button
                                onClick={() => navigate('/info-management/advertiser')}
                                style={{
                                    marginTop: '1.5rem',
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                홈으로 이동
                            </button>
                        </div>
                    ) : (
                        <HelpProvider onShowHelp={handleShowHelp}>
                            <HelpContentSetter setContent={setCurrentHelpContent} />
                            {children}
                        </HelpProvider>
                    )}
                </main>
            </div>
            <HelpModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
                pageName={currentHelpContent?.pageName || '도움말'}
                content={currentHelpContent?.content || <p>도움말 내용이 없습니다.</p>}
            />
            <NoticeModal
                isOpen={showNoticeModal}
                onClose={() => setShowNoticeModal(false)}
            />
        </div>
    );
};

const HelpContentSetter: React.FC<{ setContent: (content: any) => void }> = ({ setContent }) => {
    const { helpContent } = useHelp();
    React.useEffect(() => {
        setContent(helpContent);
    }, [helpContent, setContent]);
    return null;
};

export default Layout;
