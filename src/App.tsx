// App.tsx
import React, {useEffect} from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import Login from './pages/auth/Login';

// 👇 추가된 import: ChangePassword 컴포넌트를 불러옵니다.
import ChangePassword from './pages/auth/ChangePassword'; // 파일 경로를 실제 위치에 맞게 수정하세요.


// 기존 페이지들
import Dashboard from './pages/Dashboard';
import CompanyList from './pages/company/CompanyList';
import CompanyForm from './pages/company/CompanyForm';
import CompanyRegistForm from './pages/company/CompanyRegistForm';
import CompanyProfile from './pages/company/CompanyProfile'; // 광고주_기업 프로파일
import CompanyEmployeeProfile from './pages/company/CompanyEmployeeProfile'; // 광고주_담당자 프로파일

import EmployeeList from './pages/hr/EmployeeList';
import EmployeeForm from './pages/hr/EmployeeForm';

import ProjectList from './pages/project/ProjectList';
import ProjectForm from './pages/project/ProjectForm';
import ProjectRegistForm from './pages/project/ProjectRegistForm';

import ProjectInformation from './pages/project/ProjectInformation'; // 정보수집
import ProjectKickoffChecklist from './pages/project/ProjectKickoffChecklist'; // 프로젝트 평가 체크리스트
import ProjectProfile from './pages/project/ProjectProfile'; // 프로젝트 프로파일
import ProjectKickoff from './pages/project/ProjectKickoff'; // 프로젝트 착수서
import PTPostmortem from './pages/project/PTPostmortem'; // PT후 결과분석
import ProjectPostmortem from './pages/project/ProjectPostmortem'; // 프로젝트 실행 후 결과분석
import PTChecklist from './pages/project/PTChecklist'; // PT 준비 체크리스트

import ProjectBasicInfoTest from './pages/project/ProjectBasicInforTest'; // PT 준비 체크리스트

import MeetingMinutes from './pages/working/MeetingMinutes';
import ProjectExecution from './pages/project/ProjectExecution';
import FileManagementSystem from './pages/working/FileManagementSystem';
import Policies from "./pages/admin/permission/Policies.tsx";


import './styles/App.css';

function App() {

    return (
        <AuthProvider>
            <Routes>
                {/* 로그인 페이지 */}
                <Route path="/login" element={<Login />} />

                {/*/!* 루트 경로 - 대시보드로 리다이렉트 *!/*/}
                {/*<Route path="/" element={<Navigate to="/dashboard" replace />} />*/}
                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                {/*<Navigate to="/dashboard" replace />*/}
                                <Navigate to="/info-management/advertiser" replace />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/*/!* 대시보드 *!/*/}
                {/*<Route path="/dashboard" element={<Dashboard />} />*/}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Dashboard />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* 👇 비밀번호 변경 페이지 라우트 추가 */}
                <Route
                    path="/profile/change-password"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ChangePassword />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* 기존 라우트들을 ProtectedRoute로 감싸기 */}
                {/* ... 나머지 라우트들도 동일하게 처리 */}
                {/* 정보수집 */}
                {/*<Route path="/info-management/advertiser" element={<CompanyProfile />} />*/}
                <Route
                    path="/info-management/advertiser"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <CompanyProfile />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/info-management/advertiser-employee" element={<CompanyEmployeeProfile />} />*/}
                <Route
                    path="/info-management/advertiser-employee"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <CompanyEmployeeProfile />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/info-management/project" element={<ProjectInformation />} />*/}
                <Route
                    path="/info-management/project"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectInformation />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* 프로젝트 관련 페이지들 */}
                {/*<Route path="/project-profile" element={<ProjectProfile />} />*/}
                <Route
                    path="/project-profile"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectProfile />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/project-evaluation" element={<ProjectKickoffChecklist />} />*/}
                <Route
                    path="/project-evaluation"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectKickoffChecklist />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/project-kickoff" element={<ProjectKickoff />} />*/}
                <Route
                    path="/project-kickoff"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectKickoff />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/pt-checklist" element={<PTChecklist />} />*/}
                <Route
                    path="/pt-checklist"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PTChecklist />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/*<Route path="/pt-postmortem" element={<PTPostmortem />} />*/}
                <Route
                    path="/pt-postmortem"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PTPostmortem />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/project-execution"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectExecution />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/*<Route path="/project-postmortem" element={<ProjectPostmortem />} />*/}
                <Route
                    path="/project-postmortem"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectPostmortem />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* 기존 업체 관리 (유지) */}
                {/*<Route path="/company" element={<CompanyList />} />*/}
                <Route
                    path="/company"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <CompanyList />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/company/new" element={<CompanyForm />} />*/}
                <Route
                    path="/company/new"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <CompanyForm />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/company/regist" element={<CompanyRegistForm />} />*/}
                <Route
                    path="/company/regist"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <CompanyRegistForm />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/company/:id/edit" element={<CompanyForm />} />*/}
                <Route
                    path="/company/:id/edit"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <CompanyForm />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/*<Route path="/company/profile" element={<CompanyProfile />} />*/}
                <Route
                    path="/company/profile"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <CompanyProfile />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/company/information" element={<ProjectInformation />} />*/}
                <Route
                    path="/company/information"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectInformation />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* 기존 인적자원 관리 (유지) */}
                {/*<Route path="/hr" element={<EmployeeList />} />*/}
                <Route
                    path="/hr"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <EmployeeList />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/hr/new" element={<EmployeeForm />} />*/}
                <Route
                    path="/hr/new"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <EmployeeForm />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/hr/:id/edit" element={<EmployeeForm />} />*/}
                <Route
                    path="/hr/:id/edit"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <EmployeeForm />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* 기존 프로젝트 관리 (유지) */}
                {/*<Route path="/project" element={<ProjectList />} />*/}
                <Route
                    path="/project"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectList />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/project/new" element={<ProjectForm />} />*/}
                <Route
                    path="/project/new"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectForm />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/project/regist" element={<ProjectRegistForm />} />*/}
                <Route
                    path="/project/regist"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectRegistForm />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/project/:id/edit" element={<ProjectForm />} />*/}
                <Route
                    path="/project/:id/edit"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectForm />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/*<Route path="/project/information" element={<ProjectInformation />} />*/}
                <Route
                    path="/project/information"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectInformation />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/project/kickoff-checklist" element={<ProjectKickoffChecklist />} />*/}
                <Route
                    path="/project/kickoff-checklist"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectKickoffChecklist />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/project/profile" element={<ProjectProfile />} />*/}
                <Route
                    path="/project/profile"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectProfile />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/project/kickoff" element={<ProjectKickoff />} />*/}
                <Route
                    path="/project/kickoff"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectKickoff />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/project/pt-checklist" element={<PTChecklist />} />*/}
                <Route
                    path="/project/pt-checklist"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PTChecklist />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/*<Route path="/project/postmortem-pt" element={<PTPostmortem />} />*/}
                <Route
                    path="/project/postmortem-pt"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PTPostmortem />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/working/meeting-minutes" // Layout.tsx에 정의한 path와 일치해야 합니다.
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <MeetingMinutes />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/working/fms" // Layout.tsx에 정의한 path와 일치해야 합니다.
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <FileManagementSystem />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/permissions/policies" // Layout.tsx에 정의한 path와 일치해야 합니다.
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Policies />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/*<Route path="/project/postmortem-project" element={<ProjectPostmortem />} />*/}
                <Route
                    path="/project/postmortem-project"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectPostmortem />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/*<Route path="/test/project-basic-info" element={<ProjectBasicInfoTest />} />*/}
                <Route
                    path="/test/project-basic-info"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProjectBasicInfoTest />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* 404 처리 - 대시보드로 리다이렉트 */}
                {/*<Route path="*" element={<Navigate to="/dashboard" replace />} />*/}
                <Route
                    path="*"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                {/*<Navigate to="/dashboard" replace />*/}
                                <Navigate to="/info-management/advertiser" replace />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </AuthProvider>

    );
}

export default App;