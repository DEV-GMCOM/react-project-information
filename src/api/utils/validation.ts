// src/api/utils/validation.ts - 검증 유틸리티 함수들
export const validationHelpers = {
    // 사업자번호 형식 검사
    validateBusinessNumber: (businessNumber: string): boolean => {
        return /^\d{3}-\d{2}-\d{5}$/.test(businessNumber);
    },

    // 이메일 형식 검사
    validateEmail: (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // 전화번호 형식 검사
    validatePhone: (phone: string): boolean => {
        const cleaned = phone.replace(/\s/g, '');
        return /^(\d{2,3}-\d{3,4}-\d{4})|(\d{10,11})$/.test(cleaned);
    },

    // URL 형식 검사
    validateUrl: (url: string): boolean => {
        return /^https?:\/\/.+\..+/.test(url);
    },

    // 필수 필드 검사
    validateRequired: (value: string): boolean => {
        return Boolean(value) && value.trim().length > 0;
    },

    // 최대 길이 검사
    validateMaxLength: (value: string, maxLength: number): boolean => {
        return value.length <= maxLength;
    },

    // 최소 길이 검사
    validateMinLength: (value: string, minLength: number): boolean => {
        return value.length >= minLength;
    },

    // 숫자 범위 검사
    validateNumberRange: (value: number, min?: number, max?: number): boolean => {
        if (min !== undefined && value < min) return false;
        if (max !== undefined && value > max) return false;
        return true;
    },

    // 날짜 검증 (미래 날짜 불허)
    validateDate: (dateString: string, allowFuture: boolean = false): boolean => {
        const date = new Date(dateString);
        const today = new Date();

        if (isNaN(date.getTime())) return false;
        if (!allowFuture && date > today) return false;

        return true;
    },

    // 나이 검증 (생년월일 기준)
    validateAge: (birthDate: string, minAge: number = 0, maxAge: number = 150): boolean => {
        const birth = new Date(birthDate);
        const today = new Date();

        if (isNaN(birth.getTime())) return false;

        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age >= minAge && age <= maxAge;
    },

    // 사업자번호 체크섬 검증 (실제 사업자번호 유효성)
    validateBusinessNumberChecksum: (businessNumber: string): boolean => {
        const cleaned = businessNumber.replace(/[^0-9]/g, '');
        if (cleaned.length !== 10) return false;

        const checksum = [1, 3, 7, 1, 3, 7, 1, 3, 5];
        let sum = 0;

        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned[i]) * checksum[i];
        }

        sum += Math.floor((parseInt(cleaned[8]) * 5) / 10);
        const remainder = sum % 10;
        const checkDigit = remainder === 0 ? 0 : 10 - remainder;

        return checkDigit === parseInt(cleaned[9]);
    },

    // 한글 이름 검증
    validateKoreanName: (name: string): boolean => {
        return /^[가-힣]{2,10}$/.test(name);
    },

    // 영문 이름 검증
    validateEnglishName: (name: string): boolean => {
        return /^[a-zA-Z\s]{2,50}$/.test(name);
    },

    // 비밀번호 강도 검증
    validatePassword: (password: string): {
        isValid: boolean;
        strength: 'weak' | 'medium' | 'strong';
        issues: string[];
    } => {
        const issues: string[] = [];
        let score = 0;

        if (password.length < 8) {
            issues.push('8자 이상이어야 합니다');
        } else {
            score += 1;
        }

        if (!/[a-z]/.test(password)) {
            issues.push('소문자를 포함해야 합니다');
        } else {
            score += 1;
        }

        if (!/[A-Z]/.test(password)) {
            issues.push('대문자를 포함해야 합니다');
        } else {
            score += 1;
        }

        if (!/[0-9]/.test(password)) {
            issues.push('숫자를 포함해야 합니다');
        } else {
            score += 1;
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            issues.push('특수문자를 포함해야 합니다');
        } else {
            score += 1;
        }

        let strength: 'weak' | 'medium' | 'strong' = 'weak';
        if (score >= 4) strength = 'strong';
        else if (score >= 2) strength = 'medium';

        return {
            isValid: issues.length === 0,
            strength,
            issues
        };
    }
};

// 개별 함수들도 export (선택적 사용을 위해)
export const {
    validateBusinessNumber,
    validateEmail,
    validatePhone,
    validateUrl,
    validateRequired,
    validateMaxLength,
    validateMinLength,
    validateNumberRange,
    validateDate,
    validateAge,
    validateBusinessNumberChecksum,
    validateKoreanName,
    validateEnglishName,
    validatePassword
} = validationHelpers;