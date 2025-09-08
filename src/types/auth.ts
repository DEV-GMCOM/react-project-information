// src/types/auth.ts
export interface User {
    emp_id: number;
    emp_name: string;
    email: string;
    division?: string;
    team?: string;
    position?: string;
    role_id?: number;
    role?: Role;
}

export interface Role {
    role_id: number;
    role_name: string;
    role_code: string;
    can_view_finance: boolean;
    can_edit_finance: boolean;
}

export interface LoginRequest {
    login_id: string;
    password: string;
}

export interface LoginResponse {
    emp_id: number;
    emp_name: string;
    email: string;
    division?: string;
    team?: string;
    position?: string;
    session_id: string;
    expires_at: string;
}