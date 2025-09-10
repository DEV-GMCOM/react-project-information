import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../api'; // authService 직접 호출을 위해 경로 수정
import '../../styles/Login.css';

const Login: React.FC = () => {
    // 1. 'mode' 및 '최초 비밀번호 설정'을 위한 state 추가
    const [mode, setMode] = useState<'login' | 'setPassword'>('login');
    const [birthDate, setBirthDate] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 2. 기존 state 및 로직은 그대로 유지
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        login_id: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const from = location.state?.from?.pathname || '/dashboard';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // 3. 기존 handleSubmit을 handleLogin으로 변경하고, 412 에러 처리 로직 추가
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // AuthContext의 login 함수를 그대로 사용
            await login(formData.login_id, formData.password);
            navigate(from, { replace: true });
        } catch (err: any) {
            // [핵심] 서버로부터 412 코드를 받으면 비밀번호 설정 모드로 전환
            if (err.response && err.response.status === 412) {
                setMode('setPassword');
            } else {
                setError(err.message || '로그인에 실패했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 4. 최초 비밀번호 설정을 위한 핸들러 추가
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
                login_id: formData.login_id, // 기존 formData의 login_id 사용
                birth_date: birthDate,
                new_password: newPassword,
            });
            alert(response.message);
            setMode('login'); // 성공 시 다시 로그인 폼으로 전환
            // 폼 초기화
            setFormData(prev => ({ ...prev, password: '' }));
            setBirthDate('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.detail || '인증에 실패했습니다. 생년월일을 확인해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    // 5. JSX를 mode에 따라 조건부로 렌더링
    return (
        <div className="login-container">
            <div className="login-box">
                {mode === 'login' ? (
                    <>
                        <h2 className="login-title">GMCOM Information System</h2>
                        <form onSubmit={handleLogin} className="login-form">
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
                        </form>
                    </>
                ) : (
                    <>
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