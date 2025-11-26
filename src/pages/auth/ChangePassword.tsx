// 1. react-router-dom에서 useNavigate를 import 합니다.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/services/authService';
import { useHelp } from '../../contexts/HelpContext';
import '../../styles/ChangePassword.css';

const ChangePassword = () => {

    // 2. useNavigate 훅을 초기화합니다.
    const navigate = useNavigate();
    const { setHelpContent, showHelp } = useHelp();

    const [activeTab, setActiveTab] = useState<'password' | 'jandi'>('password');

    // Password Change States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Jandi Connect States
    const [jandiLink, setJandiLink] = useState('');

    // Common States
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'password') {
            setHelpContent({
                pageName: '비밀번호 변경',
                content: (
                    <div className="help-content">
                        <p>계정의 비밀번호를 변경하는 화면입니다.</p>
                        <ul style={{ paddingLeft: '20px', marginTop: '10px', lineHeight: '1.6' }}>
                            <li><strong>현재 비밀번호:</strong> 현재 사용 중인 비밀번호를 입력하세요.</li>
                            <li><strong>새 비밀번호:</strong> 새로 사용할 비밀번호를 입력하세요.</li>
                            <li><strong>새 비밀번호 확인:</strong> 오타 방지를 위해 새 비밀번호를 한 번 더 입력하세요.</li>
                        </ul>
                    </div>
                )
            });
        } else {
            setHelpContent({
                pageName: '잔디 연결',
                content: (
                    <div className="help-content">
                        <p>잔디(Jandi) 메신저와 연동하여 알림을 받을 수 있습니다.</p>
                        <h4 style={{ marginTop: '15px', marginBottom: '10px' }}>연결 방법</h4>
                        <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                            <li>잔디 메신저에서 알림을 받을 토픽의 <strong>[연동]</strong> 설정으로 이동합니다.</li>
                            <li><strong>[Webhook 수신 (Incoming Webhook)]</strong> 연동 항목을 찾아 추가합니다.</li>
                            <li>설정 완료 후 생성된 <strong>Webhook URL</strong>을 복사합니다.</li>
                            <li>복사한 URL을 이 화면의 <strong>'잔디 연결링크'</strong> 입력란에 붙여넣고 <strong>[등록하기]</strong>를 클릭합니다.</li>
                        </ol>
                    </div>
                )
            });
        }
    }, [activeTab, setHelpContent]);

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

    const handleJandiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jandiLink) {
            setError('잔디 연결링크를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // TODO: 실제 API 연동 필요
            await authService.connectJandi({ link: jandiLink });
            // await new Promise(resolve => setTimeout(resolve, 1000)); // API 호출 시뮬레이션

            setSuccessMessage('잔디 연결이 등록되었습니다.');
            setJandiLink('');

        } catch (err: any) {
            setError('오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabChange = (tab: 'password' | 'jandi') => {
        setActiveTab(tab);
        setError('');
        setSuccessMessage('');
        // 탭 변경 시 입력 필드 초기화 등 필요한 로직 추가 가능
    };

    return (
        <div className="change-password-container">
            <div className="form-box">

                {/* 3. [핵심] X 버튼을 추가하고, 클릭 시 이전 페이지로 이동시킵니다. */}
                <button className="close-button" onClick={() => navigate(-1)}>
                    &times;
                </button>

                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => handleTabChange('password')}
                    >
                        비밀번호 변경
                    </button>
                    <button
                        className={`tab ${activeTab === 'jandi' ? 'active' : ''}`}
                        onClick={() => handleTabChange('jandi')}
                    >
                        잔디 연결
                    </button>
                </div>

                {activeTab === 'password' ? (
                    <>
                        <div className="form-header">
                            <h2>비밀번호 변경</h2>
                            <button className="help-emoji-btn" onClick={showHelp} title="도움말">❓</button>
                        </div>
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
                    </>
                ) : (
                    <>
                        <div className="form-header">
                            <h2>잔디 메신저로 연결</h2>
                            <button className="help-emoji-btn" onClick={showHelp} title="도움말">❓</button>
                        </div>
                        <form onSubmit={handleJandiSubmit}>
                            <div className="form-group">
                                <label htmlFor="jandi_link">잔디 연결링크</label>
                                <input
                                    type="text"
                                    id="jandi_link"
                                    value={jandiLink}
                                    onChange={(e) => setJandiLink(e.target.value)}
                                    placeholder="https://..."
                                    required
                                />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            {successMessage && <div className="success-message">{successMessage}</div>}
                            <button type="submit" className="submit-button" disabled={isLoading}>
                                {isLoading ? '등록 중...' : '등록하기'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChangePassword;
