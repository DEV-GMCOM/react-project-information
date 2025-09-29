import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../api';
import '../../styles/Login.css';

const Login: React.FC = () => {
    // UI 모드 및 비밀번호 설정 입력을 위한 상태
    const [mode, setMode] = useState<'login' | 'setPassword'>('login');
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
    const from = location.state?.from?.pathname || '/dashboard';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(formData.login_id, formData.password);
            navigate(from, { replace: true });
        } catch (err: any) {
            if (err.message === 'INITIAL_PASSWORD_SETUP_REQUIRED') {
                setMode('setPassword');
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await authService.setInitialPassword({
                login_id: formData.login_id,
                birth_date: birthDate,
                new_password: newPassword,
            });
            alert(response.message);
            setMode('login');
            setFormData(prev => ({ ...prev, password: '' }));
            setBirthDate('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.detail || '인증에 실패했거나 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 👇 로그인 모드 전환 링크를 클릭했을 때 실행될 함수
    const handleSwitchToSetPasswordMode = () => {
        setMode('setPassword');
        setError(''); // 다른 모드로 전환 시 에러 메시지 초기화
    };

    return (
        <div className="login-container">
            <div className="login-box">
                {mode === 'login' ? (
                    <>
                        <h2 className="login-title">GMCOM Information System</h2>
                        <form onSubmit={handleSubmit} className="login-form">
                            {/* ... 기존 input 필드들은 동일 ... */}
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

                            {/* [추가된 부분] 비밀번호 신규 설정 링크 */}
                            <p className="mode-switch-link" onClick={handleSwitchToSetPasswordMode}>
                                비밀 번호 신규 설정
                            </p>
                        </form>
                    </>
                ) : (
                    <>
                        {/* '최초 비밀번호 설정' 부분은 변경 없음 */}
                        <h2 className="login-title">최초 비밀번호 설정</h2>
                        <form onSubmit={handleSetPassword} className="login-form">
                            <p className="info-text">최초 로그인입니다. <br/>본인 인증을 위해 **생년월일 6자리(YYMMDD)**를 입력하고 새 비밀번호를 등록해주세요.</p>
                            <div className="form-group">
                                <label htmlFor="login_id_readonly">아이디</label>
                                <input type="text" id="login_id_readonly" value={formData.login_id} readOnly />
                            </div>
                            <div className="form-group">
                                <label htmlFor="birth_date">생년월일 6자리</label>
                                <input type="text" id="birth_date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required maxLength={6} placeholder="ex: 800101" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="new_password">새 비밀번호</label>
                                <input type="password" id="new_password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="새 비밀번호" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm_password">새 비밀번호 확인</label>
                                <input type="password" id="confirm_password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="새 비밀번호 확인" />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="login-button" disabled={isLoading}>
                                {isLoading ? '설정 중...' : '설정 완료'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;