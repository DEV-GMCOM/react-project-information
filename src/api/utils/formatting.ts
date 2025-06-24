// src/api/utils/formatting.ts - 포맷팅 유틸리티 함수들
export const formatHelpers = {
    // 사업자번호 자동 포맷팅 (123-45-67890)
    formatBusinessNumber: (value: string): string => {
        let cleaned = value.replace(/[^0-9]/g, '');
        if (cleaned.length >= 3) {
            cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
        }
        if (cleaned.length >= 6) {
            cleaned = cleaned.slice(0, 6) + '-' + cleaned.slice(6, 11);
        }
        return cleaned;
    },

    // 전화번호 자동 포맷팅
    formatPhoneNumber: (value: string): string => {
        let cleaned = value.replace(/[^0-9]/g, '');

        if (cleaned.startsWith('02')) {
            // 서울 지역번호 (02-XXXX-XXXX)
            if (cleaned.length >= 2) cleaned = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
            if (cleaned.length >= 7) cleaned = cleaned.slice(0, 6) + '-' + cleaned.slice(6, 10);
        } else if (['010', '011', '016', '017', '018', '019'].some(prefix => cleaned.startsWith(prefix))) {
            // 휴대폰 번호 (010-XXXX-XXXX)
            if (cleaned.length >= 3) cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
            if (cleaned.length >= 8) cleaned = cleaned.slice(0, 8) + '-' + cleaned.slice(8, 12);
        } else {
            // 기타 지역번호 (0XX-XXX-XXXX 또는 0XX-XXXX-XXXX)
            if (cleaned.length >= 3) cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
            if (cleaned.length >= 7) {
                if (cleaned.length <= 10) {
                    cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7);
                } else {
                    cleaned = cleaned.slice(0, 8) + '-' + cleaned.slice(8, 12);
                }
            }
        }

        return cleaned;
    },

    // 숫자 포맷팅 (천단위 콤마)
    formatNumber: (value: string | number): string => {
        if (!value) return '';
        return Number(value).toLocaleString('ko-KR');
    },

    // 통화 포맷팅 (원화)
    formatCurrency: (value: string | number, currency: string = 'KRW'): string => {
        if (!value) return '';
        const formatter = new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return formatter.format(Number(value));
    },

    // 날짜 포맷팅
    formatDate: (date: string | Date, format: 'YYYY-MM-DD' | 'YYYY.MM.DD' | 'YYYY/MM/DD' | 'korean' = 'YYYY-MM-DD'): string => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) return '';

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');

        switch (format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'YYYY.MM.DD':
                return `${year}.${month}.${day}`;
            case 'YYYY/MM/DD':
                return `${year}/${month}/${day}`;
            case 'korean':
                return `${year}년 ${Number(month)}월 ${Number(day)}일`;
            default:
                return `${year}-${month}-${day}`;
        }
    },

    // 시간 포맷팅
    formatTime: (date: string | Date, format: 'HH:mm' | 'HH:mm:ss' | 'korean' = 'HH:mm'): string => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) return '';

        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');

        switch (format) {
            case 'HH:mm':
                return `${hours}:${minutes}`;
            case 'HH:mm:ss':
                return `${hours}:${minutes}:${seconds}`;
            case 'korean':
                return `${Number(hours)}시 ${Number(minutes)}분`;
            default:
                return `${hours}:${minutes}`;
        }
    },

    // 파일 크기 포맷팅
    formatFileSize: (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 퍼센트 포맷팅
    formatPercent: (value: number, decimals: number = 1): string => {
        return `${value.toFixed(decimals)}%`;
    },

    // 주민등록번호 마스킹
    maskSSN: (ssn: string): string => {
        if (ssn.length < 8) return ssn;
        return ssn.slice(0, 6) + '-' + ssn[6] + '******';
    },

    // 카드번호 마스킹
    maskCardNumber: (cardNumber: string): string => {
        const cleaned = cardNumber.replace(/[^0-9]/g, '');
        if (cleaned.length < 8) return cardNumber;

        return cleaned.slice(0, 4) + '-****-****-' + cleaned.slice(-4);
    },

    // 이메일 마스킹
    maskEmail: (email: string): string => {
        const [username, domain] = email.split('@');
        if (!domain) return email;

        const maskedUsername = username.length > 2
            ? username.slice(0, 2) + '*'.repeat(username.length - 2)
            : username;

        return `${maskedUsername}@${domain}`;
    },

    // 문자열 자르기 (말줄임표)
    truncateString: (str: string, maxLength: number, suffix: string = '...'): string => {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - suffix.length) + suffix;
    },

    // 한글 초성 추출
    getKoreanInitials: (text: string): string => {
        const initials = [
            'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
            'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
        ];

        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code >= 0xAC00 && code <= 0xD7A3) {
                const index = Math.floor((code - 0xAC00) / 588);
                return initials[index];
            }
            return char;
        }).join('');
    },

    // 나이 계산
    calculateAge: (birthDate: string): number => {
        const birth = new Date(birthDate);
        const today = new Date();

        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    },

    // 근무 연차 계산
    calculateWorkingYears: (hireDate: string): number => {
        const hire = new Date(hireDate);
        const today = new Date();

        let years = today.getFullYear() - hire.getFullYear();
        const monthDiff = today.getMonth() - hire.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
            years--;
        }

        return Math.max(0, years);
    }
};

// 개별 함수들도 export (선택적 사용을 위해)
export const {
    formatBusinessNumber,
    formatPhoneNumber,
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    formatFileSize,
    formatPercent,
    maskSSN,
    maskCardNumber,
    maskEmail,
    truncateString,
    getKoreanInitials,
    calculateAge,
    calculateWorkingYears
} = formatHelpers;