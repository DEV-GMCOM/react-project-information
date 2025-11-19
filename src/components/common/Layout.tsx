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

interface SubMenuItem {
    path: string;
    name: string;
    permission?: string; // 하위 메뉴에도 권한 속성 추가
}

interface MenuItem {
    path: string;
    name: string;
    icon: string;
    subMenus?: SubMenuItem[];
    permission?: string; // 메뉴 아이템에 권한 속성 추가
}

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

    const handleShowHelp = () => {
        setShowHelpModal(true);
    };
    const headerTitle = import.meta.env.VITE_APP_TITLE || 'GMCOM Information System';

    useEffect(() => {
        const allMenuItems = [...mainMenuItems, ...devMenuItems, ...adminMenuItems];
        const activeParentMenu = allMenuItems.find(item =>
            item.subMenus?.some(subMenu => location.pathname === subMenu.path)
        );

        if (activeParentMenu && !expandedMenus.includes(activeParentMenu.path)) {
            setExpandedMenus(prev => [...prev, activeParentMenu.path]);
        }
    }, [location.pathname]);

    useEffect(() => {
        const shouldShowNotice = localStorage.getItem('show_notice_on_login');
        if (shouldShowNotice === 'true') {
            setShowNoticeModal(true);
            localStorage.removeItem('show_notice_on_login');
        }
    }, []);

    const mainMenuItems: MenuItem[] = [
        {
            path: '/information',
            name: '기본정보',
            icon: '📋',
            subMenus: [
                { path: '/info-management/advertiser', name: '기업 / 광고주 ( 담당자 )' },
                { path: '/info-management/project', name: '프로젝트 프로파일' }
            ]
        },
        { path: '/project-kickoff', name: '프로젝트 착수서', icon: '🚀' },
        { path: '/pt-checklist', name: 'PT 전 체크', icon: '✅' },
        { path: '/pt-postmortem', name: 'PT 결과분석', icon: '🔍' },
        { path: '/project-execution', name: '프로젝트 실행파일링', icon: '📁' },
        { path: '/project-postmortem', name: '프로젝트 결과분석', icon: '📊' },
        { path: '/working/meeting-minutes', name: '자동 회의록', icon: '🗒️' }
    ];

    const devMenuItems: MenuItem[] = [
        {
            path: '/admin/permission',
            name: '권한 관리',
            icon: '🚫️',
            permission: 'admin:manage-policies', // 이 메뉴를 보기 위한 권한
        },
        { path: '/hr/employee-management', name: '직원정보 관리', icon: '🧑‍💼' },
        { path: '/working/fms', name: 'GMCOM 저장소', icon: '💾' },
        { path: '/working/clock-in-out', name: '출퇴근 체크', icon: '⏱️' },
        { path: '/sales/schedule', name: '영업스케쥴', icon: '📈' },
        { path: '/working/scheduling', name: '스케쥴링', icon: '📅' },
    ];

    const adminMenuItems: MenuItem[] = []; // 현재 사용 안 함

    // 권한에 따라 메뉴 필터링하는 로직
    const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
        const MANAGERIAL_POSITIONS = ['팀장', '본부장', '부문장', '부사장'];

        return items.map(item => {
            // 상위 메뉴 자체에 대한 권한 확인
            if (item.permission && !hasPermission(item.permission)) {
                return null;
            }

            if (!item.subMenus) {
                return item;
            }

            const filteredSubMenus = item.subMenus.filter(subItem => {
                const standardPermission = !subItem.permission || hasPermission(subItem.permission);
                if (!standardPermission) {
                    return false;
                }
                // '구성원 역할/권한' 메뉴에 대한 특별 규칙
                if (subItem.path === '/admin/permissions/policies') {
                    const isSuperAdmin = user?.role?.role_code === 'SUPER_ADMIN';
                    const isManager = user?.position && MANAGERIAL_POSITIONS.includes(user.position);
                    return isSuperAdmin || isManager;
                }
                return true;
            });

            if (filteredSubMenus.length === 0) {
                return null;
            }

            return { ...item, subMenus: filteredSubMenus };
        }).filter((item): item is MenuItem => item !== null);
    };

    const accessibleMainMenus = filterMenuItems(mainMenuItems);
    const accessibleDevMenus = filterMenuItems(devMenuItems);

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

    const hasActiveSubMenu = (item: MenuItem) => {
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

    const renderMenuItem = (item: MenuItem) => (
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
                            <button className="notice-btn" onClick={() => setShowNoticeModal(true)} title="공지사항">📢 공지</button>
                            <button className="help-btn" onClick={handleShowHelp} title="도움말">❓ 도움말</button>
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
                        {!import.meta.env.PROD && (
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
                    <HelpProvider onShowHelp={handleShowHelp}>
                        <HelpContentSetter setContent={setCurrentHelpContent} />
                        {children}
                    </HelpProvider>
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
