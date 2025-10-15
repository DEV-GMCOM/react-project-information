// src/admin/permission/Policies.tsx

import React, { useState, useRef, useEffect } from 'react'; // useState, useRef, useEffect 추가

import '../../../styles/Policies.css';

const Policies: React.FC = () => {

    return (
        <div className="policies-container">
            {/* ... 헤더 부분은 동일 ... */}
            <div className="policies-header">
                <div>
                    <h1 className="policies-title">권한 관리</h1>
                </div>
                <div className="policies-logo">GMCOM</div>
            </div>

            <div className="policies-main">
                {/* ... 다른 섹션들은 동일 ... */}
                <div className="policies-title-section">
                    <h2 className="policies-subtitle">정책 관리</h2>
                    <div className="profile-writer">
                        <div className="writer-form">
                            <div>최종 작성자 :</div>
                        </div>
                    </div>
                </div>
                <div className="policies-section">
                    <h3 className="section-header">■ 파일 리스트</h3>
                </div>

                <div className="table-action-section">
                </div>

                {/* 파일 업로드 영역 */}
                <div className="file-upload-section">
                </div>

                <div className="policies-section">
                    <h3 className="section-header">■ 생성된 텍스트</h3>
                </div>
                <div className="policies-section">
                    <h3 className="section-header">■ 생성된 Draft 기획서, 컨셉문서, 주요 안건 정리</h3>
                </div>

                <div className="policies-actions">
                    <button className="btn-secondary">저장</button>
                </div>
            </div>
        </div>
    );
};

export default Policies;