import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Login.css';

const Login: React.FC = () => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(formData.login_id, formData.password);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.message || '로그인에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2 className="login-title">GMCOM Information System</h2>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="login_id">아이디</label>
                        <input
                            type="text"
                            id="login_id"
                            name="login_id"
                            value={formData.login_id}
                            onChange={handleChange}
                            required
                            autoFocus
                            placeholder="아이디를 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;