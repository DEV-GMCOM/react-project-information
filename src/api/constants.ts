// src/api/constants.ts - 상수 정의
export const INDUSTRY_OPTIONS = [
    '제조업', '건설업', '도매및소매업', '정보통신업', '금융및보험업',
    '부동산업', '전문과학기술서비스업', '교육서비스업', '보건및사회복지사업',
    '예술스포츠여가서비스업', '숙박및음식점업', '운수및창고업', '공공행정',
    '농업임업어업', '광업', '전기가스증기', '수도하수폐기물', '기타서비스업'
];

export const BUSINESS_TYPE_OPTIONS = [
    '법인사업자', '개인사업자', '외국계법인', '비영리법인', '협동조합',
    '사회적기업', '벤처기업', '중소기업', '대기업', '공기업'
];

export const VALIDATION_MESSAGES = {
    REQUIRED: '필수 입력 항목입니다.',
    INVALID_EMAIL: '올바른 이메일 형식을 입력하세요.',
    INVALID_PHONE: '올바른 전화번호 형식을 입력하세요.',
    INVALID_BUSINESS_NUMBER: '사업자번호는 123-45-67890 형식으로 입력하세요.',
    INVALID_URL: '올바른 URL 형식을 입력하세요.',
    MAX_LENGTH: (max: number) => `최대 ${max}자까지 입력 가능합니다.`,
    MIN_VALUE: (min: number) => `${min} 이상의 값을 입력하세요.`,
    MAX_VALUE: (max: number) => `${max} 이하의 값을 입력하세요.`,
    DUPLICATE_BUSINESS_NUMBER: '이미 등록된 사업자번호입니다.',
    INVALID_DATE: '올바른 날짜를 입력하세요.',
    FUTURE_DATE_NOT_ALLOWED: '미래 날짜는 입력할 수 없습니다.'
};
