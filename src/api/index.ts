// src/api/index.ts (수정된 버전)
// 타입들 먼저 export
export * from './types';
export * from './constants';

// 유틸리티들
export * from './utils/validation';
export * from './utils/formatting';

// apiClient
export { apiClient, default as defaultApiClient } from './utils/apiClient';

// 서비스들 - 각각 개별적으로 import 후 export
export { companyService } from './services/companyService';
export { employeeService } from './services/employeeService';
export { projectService } from './services/projectService';
export { dashboardService } from './services/dashboardService';

// 기존 코드와의 호환성을 위한 통합 객체
import { companyService } from './services/companyService';
import { employeeService } from './services/employeeService';
import { projectService } from './services/projectService';
import { dashboardService } from './services/dashboardService';

export const apiService = {
    // Company
    getCompanies: companyService.getCompanies.bind(companyService),
    getCompany: companyService.getCompany.bind(companyService),
    createCompany: companyService.createCompany.bind(companyService),
    updateCompany: companyService.updateCompany.bind(companyService),
    deleteCompany: companyService.deleteCompany.bind(companyService),
    validateBusinessNumber: companyService.validateBusinessNumber.bind(companyService),
    searchCompanies: companyService.searchCompanies.bind(companyService),

    // Employee
    getEmployees: employeeService.getEmployees.bind(employeeService),
    getEmployee: employeeService.getEmployee.bind(employeeService),
    createEmployee: employeeService.createEmployee.bind(employeeService),
    updateEmployee: employeeService.updateEmployee.bind(employeeService),
    getDepartments: employeeService.getDepartments.bind(employeeService),

    // Project
    getProjects: projectService.getProjects.bind(projectService),
    getProject: projectService.getProject.bind(projectService),
    createProject: projectService.createProject.bind(projectService),
    updateProject: projectService.updateProject.bind(projectService),

    // Dashboard
    getDashboardStats: dashboardService.getDashboardStats.bind(dashboardService),
    getProjectsByStatus: dashboardService.getProjectsByStatus.bind(dashboardService),
    getEmployeesByDepartment: dashboardService.getEmployeesByDepartment.bind(dashboardService),
    healthCheck: dashboardService.healthCheck.bind(dashboardService),
};

// Auth 서비스 추가
export { authService } from './services/authService';
export type { LoginRequest, User, LoginResponse } from './services/authService';