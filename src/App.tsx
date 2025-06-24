// App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import CompanyList from './pages/company/CompanyList';
import CompanyForm from './pages/company/CompanyForm';
import EmployeeList from './pages/hr/EmployeeList';
import EmployeeForm from './pages/hr/EmployeeForm';
import ProjectList from './pages/project/ProjectList';
import ProjectForm from './pages/project/ProjectForm';
import './styles/App.css';

// import CompanyRegistForm from "@/pages/company/CompanyRegistForm.tsx";
// import ProjectRegistForm from "@/pages/project/ProjectRegistForm.tsx";
import CompanyRegistForm from "./pages/company/CompanyRegistForm.tsx";
import ProjectRegistForm from "./pages/project/ProjectRegistForm.tsx";

function App() {
  return (
    <Layout>
      <Routes>
        {/* 루트 경로 - 대시보드로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 대시보드 */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 업체 관리 */}
        <Route path="/company" element={<CompanyList />} />
        <Route path="/company/new" element={<CompanyForm />} />
        <Route path="/company/regist" element={<CompanyRegistForm />} />
        <Route path="/company/:id/edit" element={<CompanyForm />} />
        
        {/* 인적자원 관리 */}
        <Route path="/hr" element={<EmployeeList />} />
        <Route path="/hr/new" element={<EmployeeForm />} />
        <Route path="/hr/:id/edit" element={<EmployeeForm />} />
        
        {/* 프로젝트 관리 */}
        <Route path="/project" element={<ProjectList />} />
        <Route path="/project/new" element={<ProjectForm />} />
        <Route path="/project/regist" element={<ProjectRegistForm />} />
        <Route path="/project/:id/edit" element={<ProjectForm />} />
        
        {/* 404 처리 - 대시보드로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;