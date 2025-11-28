// src/components/meeting/NewMeetingModal.tsx
import React, { useState } from 'react';
import MeetingBasicInfoForm from './MeetingBasicInfoForm';
import { Employee, EmployeeSimple } from '../../api/types';
import '../../styles/modal.css';

interface NewMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    // 기본정보 Form Props
    meetingTitle: string;
    setMeetingTitle: (value: string) => void;
    meetingDateTime: Date | null;
    setMeetingDateTime: (value: Date | null) => void;
    meetingPlace: string;
    setMeetingPlace: (value: string) => void;
    projectName: string;
    onProjectSearch: () => void;
    sharedWith: EmployeeSimple[];
    onEmployeeSearch: () => void;
    onRemoveEmployee: (id: number) => void;
    tags: string;
    setTags: (value: string) => void;
    companionAttendees: string; // ✅ 추가
    setCompanionAttendees: (value: string) => void; // ✅ 추가
    shareMethods: { email: boolean; jandi: boolean };
    setShareMethods: (value: { email: boolean; jandi: boolean }) => void;
}

const NewMeetingModal: React.FC<NewMeetingModalProps> = ({
                                                             isOpen,
                                                             onClose,
                                                             onSave,
                                                             ...formProps
                                                         }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false); // 로딩 상태 추가

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsLoading(true); // 저장 시작 시 로딩 활성화
        try {
            await onSave();
            onClose();
        } catch (error) {
            console.error('저장 실패:', error);
        } finally {
            setIsLoading(false); // 저장 완료/실패 시 로딩 비활성화
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>신규 회의록 작성</h2>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <h3 className="section-header-meetingminutes">■ 기본 정보</h3>
                    <MeetingBasicInfoForm {...formProps} />
                </div>
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose} disabled={isLoading}>취소</button>
                    <button className="btn-primary" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <div className="circle-spinner"></div> : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewMeetingModal;