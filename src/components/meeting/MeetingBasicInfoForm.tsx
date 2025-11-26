// src/components/meeting/MeetingBasicInfoForm.tsx
import React from 'react';
import DatePicker from "react-datepicker";
import { ko } from 'date-fns/locale';
import { Employee, EmployeeSimple } from '../../api/types';


interface MeetingBasicInfoFormProps {
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
    readOnly?: boolean; // 모달에서는 false, 페이지에서는 상황에 따라
}

const MeetingBasicInfoForm: React.FC<MeetingBasicInfoFormProps> = ({
                                                                       meetingTitle,
                                                                       setMeetingTitle,
                                                                       meetingDateTime,
                                                                       setMeetingDateTime,
                                                                       meetingPlace,
                                                                       setMeetingPlace,
                                                                       projectName,
                                                                       onProjectSearch,
                                                                       sharedWith,
                                                                       onEmployeeSearch,
                                                                       onRemoveEmployee,
                                                                       tags,
                                                                       setTags,
                                                                       companionAttendees, // ✅ 추가
                                                                       setCompanionAttendees, // ✅ 추가
                                                                       shareMethods,
                                                                       setShareMethods,
                                                                       readOnly = false
                                                                   }) => {
    return (
        <div style={{ padding: '2.5rem 1.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* 회의록 제목 */}
                <div className="writer-field">
                    <label className="writer-field-label">회의록 제목</label>
                    <input
                        type="text"
                        className="writer-field-input"
                        style={{ width: '100%' }}
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder="회의록 제목을 입력하세요"
                        disabled={readOnly}
                    />
                </div>

                {/* 회의 일시 및 장소 */}
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div className="writer-field" style={{ flex: 1 }}>
                        <label className="writer-field-label">회의 일시</label>
                        <DatePicker
                            locale={ko}
                            selected={meetingDateTime}
                            onChange={(date) => setMeetingDateTime(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm"
                            className="writer-field-input"
                            placeholderText="회의 일시를 선택하세요"
                            disabled={readOnly}
                        />
                    </div>
                    <div className="writer-field" style={{ flex: 1 }}>
                        <label className="writer-field-label">회의 장소</label>
                        <input
                            type="text"
                            className="writer-field-input"
                            style={{ width: '100%' }}
                            value={meetingPlace}
                            onChange={(e) => setMeetingPlace(e.target.value)}
                            placeholder="회의 장소를 입력하세요"
                            disabled={readOnly}
                        />
                    </div>
                </div>

                {/* 프로젝트 검색 */}
                <div className="writer-field">
                    <label className="writer-field-label">프로젝트</label>
                    {/*<div className="input-with-search">*/}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                        <input
                            type="text"
                            className="writer-field-input"
                            value={projectName}
                            readOnly
                            placeholder="프로젝트를 검색하세요"
                            tabIndex={-1}
                        />
                        <button
                            type="button"
                            className="search-btn"
                            onClick={onProjectSearch}
                            disabled={readOnly}
                        >
                            🔍
                        </button>
                    </div>
                </div>

                {/* 회의록 공유 */}
                <div className="writer-field">
                    <label className="writer-field-label">참석자</label>
                    {/*<div className="input-with-search">*/}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                        <input
                            type="text"
                            className="writer-field-input"
                            value={sharedWith.map(emp => emp.name).join(', ')}
                            readOnly
                            placeholder="직원을 검색하세요"
                        />
                        <button
                            type="button"
                            className="search-btn"
                            onClick={onEmployeeSearch}
                            disabled={readOnly}
                        >
                            🔍
                        </button>
                    </div>
                </div>

                {/* 공유 방법 */}
                <div className="writer-field">
                    <label className="writer-field-label">공유 방법</label>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                                type="checkbox"
                                className="meeting-minutes-checkbox"
                                checked={shareMethods.email}
                                onChange={(e) => setShareMethods({ ...shareMethods, email: e.target.checked })}
                                disabled={readOnly}
                            />
                            이메일
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                                type="checkbox"
                                className="meeting-minutes-checkbox"
                                checked={shareMethods.jandi}
                                onChange={(e) => setShareMethods({ ...shareMethods, jandi: e.target.checked })}
                                disabled={readOnly}
                            />
                            잔디
                        </label>
                    </div>
                </div>



                {/* 동석자 */}
                <div className="writer-field">
                    <label className="writer-field-label">동석자</label>
                    <input
                        type="text"
                        className="writer-field-input"
                        style={{ width: '100%' }}
                        value={companionAttendees}
                        onChange={(e) => setCompanionAttendees(e.target.value)}
                        placeholder="동석자 이름을 입력하세요 (쉼표로 구분)"
                        disabled={readOnly}
                    />
                </div>

                {/* 태그 */}
                <div className="writer-field">
                    <label className="writer-field-label">태그</label>
                    <input
                        type="text"
                        className="writer-field-input"
                        style={{ width: '100%' }}
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="태그를 입력하세요 (쉼표로 구분)"
                        disabled={readOnly}
                    />
                </div>
            </div>
        </div>
    );
};

export default MeetingBasicInfoForm;