// src/hooks/usePermissions.ts
import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
    const { user } = useAuth();

    const hasFinanceAccess = (): boolean => {
        if (!user) return false;

        // 1. 역할 기반 체크
        if (user.role?.can_view_finance) {
            return true;
        }

        // 2. 부서 기반 체크 (재무본부 소속)
        if (user.division && user.division.includes('재무')) {
            return true;
        }

        // 3. 직급 기반 체크 (임원급 이상)
        const executivePositions = ['본부장', '이사', '상무', '전무', '부사장', '사장', '대표이사', 'CEO', 'CFO'];
        if (user.position && executivePositions.some(pos => user.position?.includes(pos))) {
            return true;
        }

        return false;
    };

    const canEditFinance = (): boolean => {
        if (!user) return false;

        // 1. 역할 기반 체크
        if (user.role?.can_edit_finance) {
            return true;
        }

        // 2. 재무팀장 이상만 수정 가능
        if (user.division && user.division.includes('재무')) {
            const managerPositions = ['팀장', '차장', '부장', '본부장', '이사'];
            if (user.position && managerPositions.some(pos => user.position?.includes(pos))) {
                return true;
            }
        }

        return false;
    };

    const canAccessField = (fieldName: string): boolean => {
        // 재무 관련 필드 체크
        const financeFields = ['bank_name', 'account_number'];
        if (financeFields.includes(fieldName)) {
            return hasFinanceAccess();
        }

        // 일반 필드는 모두 접근 가능
        return true;
    };

    return {
        hasFinanceAccess,
        canEditFinance,
        canAccessField
    };
};