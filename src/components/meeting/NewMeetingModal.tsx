// src/components/meeting/NewMeetingModal.tsx
import React from 'react';
import MeetingBasicInfoForm from './MeetingBasicInfoForm';
import { Employee } from '../../api/types';
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
    sharedWith: Employee[];
    onEmployeeSearch: () => void;
    onRemoveEmployee: (id: number) => void;
    attendees: string;
    setAttendees: (value: string) => void;
    tags: string;
    setTags: (value: string) => void;
    shareMethods: { email: boolean; jandi: boolean };
    setShareMethods: (value: { email: boolean; jandi: boolean }) => void;
}

const NewMeetingModal: React.FC<NewMeetingModalProps> = ({
                                                             isOpen,
                                                             onClose,
                                                             onSave,
                                                             ...formProps
                                                         }) => {
    if (!isOpen) return null;

    const handleSave = async () => {
        await onSave();
        onClose();
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
                    <button className="btn-secondary" onClick={onClose}>취소</button>
                    <button className="btn-primary" onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
};

export default NewMeetingModal;