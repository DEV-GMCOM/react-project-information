// 1. react-router-dom에서 useNavigate를 import 합니다.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/services/authService';
import '../../styles/ChangePassword.css';

const ChangePassword = () => {

    // 2. useNavigate 훅을 초기화합니다.
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        if (!currentPassword || !newPassword) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await authService.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });
            setSuccessMessage(response.message || '비밀번호가 성공적으로 변경되었습니다.');
            // 성공 후 폼 초기화
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // 4. [핵심] 성공 메시지를 1.5초간 보여준 후 이전 페이지로 이동합니다.
            setTimeout(() => {
                navigate(-1); // -1은 '뒤로 가기'와 동일한 기능입니다.
            }, 1500);

        } catch (err: any) {
            setError(err.response?.data?.detail || '오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="change-password-container">
            <div className="form-box">

                {/* 3. [핵심] X 버튼을 추가하고, 클릭 시 이전 페이지로 이동시킵니다. */}
                <button className="close-button" onClick={() => navigate(-1)}>
                    &times;
                </button>

                <h2>비밀번호 변경</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="current_password">현재 비밀번호</label>
                        <input type="password" id="current_password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new_password">새 비밀번호</label>
                        <input type="password" id="new_password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm_password">새 비밀번호 확인</label>
                        <input type="password" id="confirm_password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    {successMessage && <div className="success-message">{successMessage}</div>}
                    <button type="submit" className="submit-button" disabled={isLoading}>
                        {isLoading ? '변경 중...' : '변경하기'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
