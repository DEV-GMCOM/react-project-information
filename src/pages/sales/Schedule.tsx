import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import '../../styles/SalesSchedule.css'; // Reusing styles for layout
import '../../styles/Layout.css'; // For tab styles

const SalesSchedule: React.FC = () => {
    return (
        <div className="sales-schedule-container">
            <div className="sales-schedule-header">
                <h1 className="sales-schedule-title">영업 스케쥴</h1>
            </div>
            <div className="tab-navigation">
                <NavLink
                    to="/sales/schedule"
                    className={({ isActive }) => "tab-button" + (isActive ? " active" : "")}
                    end // Important: this ensures the base path is only active when no other sub-route is
                >
                    현황확인
                </NavLink>
                <NavLink
                    to="/sales/schedule/notifications"
                    className={({ isActive }) => "tab-button" + (isActive ? " active" : "")}
                >
                    알림현황
                </NavLink>
            </div>
            <div className="sales-schedule-main" style={{ borderRadius: '0 8px 8px 8px' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default SalesSchedule;
