// App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';

// Pages
import Dashboard from './pages/Dashboard';
import CompanyList from './pages/company/CompanyList';
import CompanyForm from './pages/company/CompanyForm';
import CompanyRegistForm from './pages/company/CompanyRegistForm';
import CompanyProfile from './pages/company/CompanyProfile';
import CompanyEmployeeProfile from './pages/company/CompanyEmployeeProfile';
import EmployeeList from './pages/hr/EmployeeList';
import EmployeeForm from './pages/hr/EmployeeForm';
import HRManagement from "./pages/hr/HRManagement.tsx";
import ProjectList from './pages/project/ProjectList';
import ProjectForm from './pages/project/ProjectForm';
import ProjectRegistForm from './pages/project/ProjectRegistForm';
import ProjectInformation from './pages/project/ProjectInformation';
import ProjectKickoffChecklist from './pages/project/ProjectKickoffChecklist';
import ProjectProfile from './pages/project/ProjectProfile';
import ProjectKickoff from './pages/project/ProjectKickoff';
import PTPostmortem from './pages/project/PTPostmortem';
import ProjectPostmortem from './pages/project/ProjectPostmortem';
import PTChecklist from './pages/project/PTChecklist';
import ProjectBasicInfoTest from './pages/project/ProjectBasicInforTest';
import MeetingMinutes from './pages/working/MeetingMinutes';
import ProjectExecution from './pages/project/ProjectExecution';
import FileManagementSystem from './pages/working/FileManagementSystem';

// Admin Pages & Permission Routes
import Policies from "./pages/admin/permission/Policies.tsx";
import AccessControl from "./pages/admin/permission/AccessControl.tsx";
import PermissionRoute from "./components/common/PermissionRoute.tsx";
import PolicyManagement from "./pages/admin/permission/PolicyManagement.tsx";
import PolicyDetail from "./pages/admin/permission/PolicyDetail.tsx";
import RbacBuilder from "./pages/admin/permission/RbacBuilder.tsx";
import AbacBuilder from "./pages/admin/permission/AbacBuilder.tsx";
import SalesSchedule from "./pages/sales/Schedule.tsx";
import CalendarStatus from "./pages/sales/CalendarStatus.tsx";
import NotificationStatus from "./pages/sales/NotificationStatus.tsx";
import ClockInOut from "./pages/working/ClockInOut.tsx";
import Scheduling from "./pages/working/Scheduling.tsx";
import VisionAPI from "./pages/working/VisionAPI.tsx";


import './styles/App.css';

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Layout><Navigate to="/info-management/advertiser" replace /></Layout></ProtectedRoute>} />

                {/* Dashboard */}
                <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />

                {/* Profile */}
                <Route path="/profile/change-password" element={<ProtectedRoute><Layout><ChangePassword /></Layout></ProtectedRoute>} />

                {/* Info Management */}
                <Route path="/info-management/advertiser" element={<ProtectedRoute><Layout><CompanyProfile /></Layout></ProtectedRoute>} />
                <Route path="/info-management/advertiser-employee" element={<ProtectedRoute><Layout><CompanyEmployeeProfile /></Layout></ProtectedRoute>} />
                <Route path="/info-management/project" element={<ProtectedRoute><Layout><ProjectInformation /></Layout></ProtectedRoute>} />

                {/* Project */}
                <Route path="/project-profile" element={<ProtectedRoute><Layout><ProjectProfile /></Layout></ProtectedRoute>} />
                <Route path="/project-evaluation" element={<ProtectedRoute><Layout><ProjectKickoffChecklist /></Layout></ProtectedRoute>} />
                <Route path="/project-kickoff" element={<ProtectedRoute><Layout><ProjectKickoff /></Layout></ProtectedRoute>} />
                <Route path="/pt-checklist" element={<ProtectedRoute><Layout><PTChecklist /></Layout></ProtectedRoute>} />
                <Route path="/pt-postmortem" element={<ProtectedRoute><Layout><PTPostmortem /></Layout></ProtectedRoute>} />
                <Route path="/project-execution" element={<ProtectedRoute><Layout><ProjectExecution /></Layout></ProtectedRoute>} />
                <Route path="/project-postmortem" element={<ProtectedRoute><Layout><ProjectPostmortem /></Layout></ProtectedRoute>} />
                <Route path="/project" element={<ProtectedRoute><Layout><ProjectList /></Layout></ProtectedRoute>} />
                <Route path="/project/new" element={<ProtectedRoute><Layout><ProjectForm /></Layout></ProtectedRoute>} />
                <Route path="/project/regist" element={<ProtectedRoute><Layout><ProjectRegistForm /></Layout></ProtectedRoute>} />
                <Route path="/project/:id/edit" element={<ProtectedRoute><Layout><ProjectForm /></Layout></ProtectedRoute>} />
                <Route path="/project/information" element={<ProtectedRoute><Layout><ProjectInformation /></Layout></ProtectedRoute>} />
                <Route path="/project/kickoff-checklist" element={<ProtectedRoute><Layout><ProjectKickoffChecklist /></Layout></ProtectedRoute>} />
                <Route path="/project/postmortem-pt" element={<ProtectedRoute><Layout><PTPostmortem /></Layout></ProtectedRoute>} />
                <Route path="/project/postmortem-project" element={<ProtectedRoute><Layout><ProjectPostmortem /></Layout></ProtectedRoute>} />

                {/* Company */}
                <Route path="/company" element={<ProtectedRoute><Layout><CompanyList /></Layout></ProtectedRoute>} />
                <Route path="/company/new" element={<ProtectedRoute><Layout><CompanyForm /></Layout></ProtectedRoute>} />
                <Route path="/company/regist" element={<ProtectedRoute><Layout><CompanyRegistForm /></Layout></ProtectedRoute>} />
                <Route path="/company/:id/edit" element={<ProtectedRoute><Layout><CompanyForm /></Layout></ProtectedRoute>} />
                <Route path="/company/profile" element={<ProtectedRoute><Layout><CompanyProfile /></Layout></ProtectedRoute>} />
                <Route path="/company/information" element={<ProtectedRoute><Layout><ProjectInformation /></Layout></ProtectedRoute>} />

                {/* HR */}
                <Route path="/hr" element={<ProtectedRoute><Layout><EmployeeList /></Layout></ProtectedRoute>} />
                <Route path="/hr/new" element={<ProtectedRoute><Layout><EmployeeForm /></Layout></ProtectedRoute>} />
                <Route path="/hr/:id/edit" element={<ProtectedRoute><Layout><EmployeeForm /></Layout></ProtectedRoute>} />
                <Route path="/hr/employee-management" element={<ProtectedRoute><Layout><HRManagement /></Layout></ProtectedRoute>} />

                {/* Sales */}
                <Route path="/sales/schedule" element={<ProtectedRoute><Layout><SalesSchedule /></Layout></ProtectedRoute>}>
                    <Route index element={<CalendarStatus />} />
                    <Route path="notifications" element={<NotificationStatus />} />
                </Route>

                {/* Working */}
                <Route path="/working/meeting-minutes" element={<ProtectedRoute><Layout><MeetingMinutes /></Layout></ProtectedRoute>} />
                <Route path="/working/fms" element={<ProtectedRoute><Layout><FileManagementSystem /></Layout></ProtectedRoute>} />
                <Route path="/working/clock-in-out" element={<ProtectedRoute><Layout><ClockInOut /></Layout></ProtectedRoute>} />
                <Route path="/working/scheduling" element={<ProtectedRoute><Layout><Scheduling /></Layout></ProtectedRoute>} />
                <Route path="/working/vision-api" element={<ProtectedRoute><Layout><VisionAPI /></Layout></ProtectedRoute>} />

                {/* Admin & Permissions */}
                <Route path="/admin/permission/policy" element={<ProtectedRoute><Layout><PolicyManagement /></Layout></ProtectedRoute>} />
                <Route path="/admin/permission/policy/:resourceId" element={<ProtectedRoute><Layout><PolicyDetail /></Layout></ProtectedRoute>} />
                <Route
                    path="/admin/permissions/policies"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PermissionRoute requiredPermission="VIEW_MEMBER_ROLES">
                                    <Policies />
                                </PermissionRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/permission"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PermissionRoute requiredPermission="admin:manage-policies">
                                    <AccessControl />
                                </PermissionRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/permission/rbac"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PermissionRoute requiredPermission="admin:manage-policies">
                                    <RbacBuilder />
                                </PermissionRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/permission/abac"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PermissionRoute requiredPermission="admin:manage-policies">
                                    <AbacBuilder />
                                </PermissionRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />


                {/* Test */}
                <Route path="/test/project-basic-info" element={<ProtectedRoute><Layout><ProjectBasicInfoTest /></Layout></ProtectedRoute>} />

                {/* 404 Not Found */}
                <Route path="*" element={<ProtectedRoute><Layout><Navigate to="/info-management/advertiser" replace /></Layout></ProtectedRoute>} />
            </Routes>
        </AuthProvider>
    );
}

export default App;