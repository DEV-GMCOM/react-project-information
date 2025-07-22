import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// API 서비스 모킹
vi.mock('./api', () => ({
  apiService: {
    getDashboardStats: vi.fn().mockResolvedValue({
      total_stats: {
        companies: 0,
        employees: 0,
        projects: 0,
      },
      active_stats: {
        employees: 0,
        projects: 0,
      },
      monthly_stats: {
        new_companies: 0,
        new_employees: 0,
      },
    }),
    getProjectsByStatus: vi.fn().mockResolvedValue({ data: [] }),
    getEmployeesByDepartment: vi.fn().mockResolvedValue({ data: [] }),
    healthCheck: vi.fn().mockResolvedValue({
      status: 'healthy',
      database: 'connected',
      service: 'running'
    }),
  },
}));

// App 컴포넌트를 Router로 감싸서 테스트
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    // 각 테스트 전에 모든 모킹 초기화
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => {
      renderWithRouter(<App />);
    }).not.toThrow();
  });

  it('App component is defined', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  it('app renders correctly with router', () => {
    expect(() => {
      renderWithRouter(<App />);
    }).not.toThrow();
  });
});