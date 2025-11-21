import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../api';
import '../../styles/Login.css';


const Login: React.FC = () => {
    // UI 모드 및 비밀번호 설정 입력을 위한 상태
    const [mode, setMode] = useState<'login' | 'setPassword'>('login');
    const [birthDate, setBirthDate] = useState('');

    // 기존 상태 변수
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        login_id: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // const from = location.state?.from?.pathname || '/dashboard';
    const from = location.state?.from?.pathname || '/info-management/advertiser';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    // '로그인' 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(formData.login_id, formData.password);
            navigate(from, { replace: true });
        } catch (err: any) {
            // NOTE: API에서 '초기 비밀번호 설정 필요' 응답 시 setPassword 모드로 자동 전환
            if (err.message === 'INITIAL_PASSWORD_SETUP_REQUIRED') {
                setMode('setPassword');
            } else {
                setError(err.message || '로그인에 실패했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // '최초 비밀번호 설정' 핸들러
    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            // '최초 설정' API 호출 (기존 비밀번호가 있으면 실패해야 함)
            const response = await authService.requestPasswordResetWithBirthDate({
                login_id: formData.login_id,
                birth_date: birthDate,
            });
            alert(response.message || '임시 비밀번호가 이메일로 발송되었습니다. 다시 로그인해주세요.');
            handleGoBack(); // 로그인 모드로 돌아가기
        } catch (err: any) {
            setError(err.response?.data?.detail || '인증에 실패했거나 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 👇 모드 전환: '최초 설정'
    const handleSwitchToSetPasswordMode = () => {
        setMode('setPassword');
        setError('');
    };

    // 👇 '로그인' 모드로 돌아가기 (및 상태 초기화)
    const handleGoBack = () => {
        setMode('login');
        setError('');
        setBirthDate('');
        // ID는 유지하고 비밀번호 필드만 지울 수 있습니다.
        setFormData(prev => ({ ...prev, password: '' }));
    };

    return (
        <div className="login-container">
            <div className="login-box">
                {/* 1. 로그인 모드 */}
                {mode === 'login' && (
                    <>
                        <h2 className="login-title">GMCOM Information System</h2>
                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <label htmlFor="login_id">아이디</label>
                                <input type="text" id="login_id" name="login_id" className="login-input" value={formData.login_id} onChange={handleChange} required autoFocus placeholder="아이디를 입력하세요" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">비밀번호</label>
                                <input type="password" id="password" name="password" className="login-input" value={formData.password} onChange={handleChange} required placeholder="비밀번호를 입력하세요" />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="login-button" disabled={isLoading}>
                                {isLoading ? '로그인 중...' : '로그인'}
                            </button>
                            <p className="mode-switch-link" onClick={handleSwitchToSetPasswordMode}>
                                최초 등록자 / 비밀번호 새로 발급
                            </p>
                        </form>
                    </>
                )}

                {/* 2. 신규 비밀번호 요청 모드 */}
                {mode === 'setPassword' && (
                    <>
                        <button className="close-button" onClick={handleGoBack} type="button">
                            &times;
                        </button>
                        <h2 className="login-title">신규 비밀번호 요청</h2>
                        <form onSubmit={handleSetPassword} className="login-form">
                            <p className="info-text">비밀번호를 신규로 발급하여 회사메일로 전송해 드립니다. 로그인 후 비밀번호를 변경해 주세요<br/><br/><br/></p>
                            <div className="form-group">
                                <label htmlFor="login_id_set">아이디</label>
                                <input
                                    type="text"
                                    id="login_id_set"
                                    name="login_id"
                                    value={formData.login_id}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                    placeholder="이메일 앞부분 (잔디아이디)을 입력하세요"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="birth_date_set">생년월일 6자리</label>
                                <input type="text" id="birth_date_set" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required maxLength={6} placeholder="ex: 800101" />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="login-button" disabled={isLoading}>
                                {isLoading ? '요청 중...' : '요청 완료'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
