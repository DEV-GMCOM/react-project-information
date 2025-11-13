import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../api';
import '../../styles/Login.css';


const Login: React.FC = () => {
    // UI 모드 및 비밀번호 설정 입력을 위한 상태
    const [mode, setMode] = useState<'login' | 'setPassword' | 'resetPassword'>('login');
    const [birthDate, setBirthDate] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
        if (newPassword !== confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            // '최초 설정' API 호출 (기존 비밀번호가 있으면 실패해야 함)
            const response = await authService.setInitialPassword({
                login_id: formData.login_id,
                birth_date: birthDate,
                new_password: newPassword,
            });
            alert(response.message || '비밀번호가 설정되었습니다. 다시 로그인해주세요.');
            handleGoBack(); // 로그인 모드로 돌아가기
        } catch (err: any) {
            setError(err.response?.data?.detail || '인증에 실패했거나 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // [신규] '비밀번호 변경' 핸들러
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            // '비밀번호 변경/재설정' API 호출 (기존 비밀번호를 덮어써야 함)
            // !!! 참고: authService.resetPassword는 예시이며, 실제 api 서비스 파일에 구현해야 합니다.
            const response = await authService.resetPassword({
                login_id: formData.login_id,
                birth_date: birthDate,
                new_password: newPassword,
            });
            alert(response.message || '비밀번호가 변경되었습니다. 다시 로그인해주세요.');
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

    // 👇 모드 전환: '비밀번호 변경'
    const handleSwitchToChangePasswordMode = () => {
        setMode('resetPassword');
        setError('');
    };

    // 👇 '로그인' 모드로 돌아가기 (및 상태 초기화)
    const handleGoBack = () => {
        setMode('login');
        setError('');
        setBirthDate('');
        setNewPassword('');
        setConfirmPassword('');
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
                                <input type="text" id="login_id" name="login_id" value={formData.login_id} onChange={handleChange} required autoFocus placeholder="아이디를 입력하세요" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">비밀번호</label>
                                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required placeholder="비밀번호를 입력하세요" />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="login-button" disabled={isLoading}>
                                {isLoading ? '로그인 중...' : '로그인'}
                            </button>
                            <p className="mode-switch-link" onClick={handleSwitchToSetPasswordMode}>
                                첫방문이세요? 비밀번호 설정 하러 가실께요~
                            </p>
                            <p className="mode-switch-link" onClick={handleSwitchToChangePasswordMode}>
                                비밀번호 잊으셨어요? 맨날 그러시네요~
                            </p>
                        </form>
                    </>
                )}

                {/* 2. 최초 비밀번호 설정 모드 */}
                {mode === 'setPassword' && (
                    <>
                        <button className="close-button" onClick={handleGoBack} type="button">
                            &times;
                        </button>
                        <h2 className="login-title">최초 비밀번호 설정</h2>
                        <form onSubmit={handleSetPassword} className="login-form">
                            <p className="info-text">최초 로그인입니다. <br/>본인 인증을 위해 **생년월일 6자리(YYMMDD)**를 입력하고 새 비밀번호를 등록해주세요.</p>
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
                                    placeholder="아이디를 입력하세요"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="birth_date_set">생년월일 6자리</label>
                                <input type="text" id="birth_date_set" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required maxLength={6} placeholder="ex: 800101" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="new_password_set">새 비밀번호</label>
                                <input type="password" id="new_password_set" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="새 비밀번호" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm_password_set">새 비밀번호 확인</label>
                                <input type="password" id="confirm_password_set" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="새 비밀번호 확인" />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="login-button" disabled={isLoading}>
                                {isLoading ? '설정 중...' : '설정 완료'}
                            </button>
                        </form>
                    </>
                )}

                {/* 3. 비밀번호 변경 모드 */}
                {mode === 'resetPassword' && (
                    <>
                        <button className="close-button" onClick={handleGoBack} type="button">
                            &times;
                        </button>
                        <h2 className="login-title">비밀번호 변경</h2>
                        {/* [수정됨] onSubmit에 새로 만든 핸들러를 연결합니다. */}
                        <form onSubmit={handleResetPassword} className="login-form">
                            <p className="info-text">본인 인증을 위해 **아이디와 생년월일 6자리**를 입력하고<br/>새 비밀번호를 등록해주세요.</p>
                            <div className="form-group">
                                <label htmlFor="login_id_change">아이디</label>
                                <input
                                    type="text"
                                    id="login_id_change"
                                    name="login_id"
                                    value={formData.login_id}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                    placeholder="아이디를 입력하세요"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="birth_date_change">생년월일 6자리</label>
                                <input type="text" id="birth_date_change" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required maxLength={6} placeholder="ex: 800101" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="new_password_change">새 비밀번호</label>
                                <input type="password" id="new_password_change" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="새 비밀번호" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm_password_change">새 비밀번호 확인</label>
                                <input type="password" id="confirm_password_change" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="새 비밀번호 확인" />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="login-button" disabled={isLoading}>
                                {isLoading ? '변경 중...' : '변경 완료'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;