import React, { useState, useEffect } from 'react';
import '../../styles/ProjectKickoffChecklist.css';

interface ChecklistScores {
    revenue: number | '';
    feasibility: number | '';
    rfpReview: number | '';
    futureValue: number | '';
    relationship: number | '';
}

interface ProjectKickoffChecklist {
    // 체크사항 점수
    scores: ChecklistScores;

    // 의견
    managerOpinion: string;
    managerEvaluation: string;

    // 작성자 정보
    writerName: string;
    writerDepartment: string;
}

const ProjectKickoffChecklistForm: React.FC = () => {
    const [formData, setFormData] = useState<ProjectKickoffChecklist>({
        scores: {
            revenue: '',
            feasibility: '',
            rfpReview: '',
            futureValue: '',
            relationship: ''
        },
        managerOpinion: '',
        managerEvaluation: '',
        writerName: '',
        writerDepartment: ''
    });

    // 총점 계산
    const [totalScore, setTotalScore] = useState<number | null>(null);
    const [grade, setGrade] = useState<string>('');

    useEffect(() => {
        const { revenue, feasibility, rfpReview, futureValue, relationship } = formData.scores;

        // 모든 점수가 입력되었는지 확인
        if (revenue !== '' && feasibility !== '' && rfpReview !== '' &&
            futureValue !== '' && relationship !== '') {
            const total = Number(revenue) + Number(feasibility) + Number(rfpReview) +
                Number(futureValue) + Number(relationship);
            setTotalScore(total);

            // 등급 계산
            if (total <= 70) {
                setGrade('C');
            } else if (total <= 80) {
                setGrade('B');
            } else {
                setGrade('A');
            }
        } else {
            setTotalScore(null);
            setGrade('');
        }
    }, [formData.scores]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleScoreChange = (scoreType: keyof ChecklistScores, value: string, maxScore: number) => {
        const numValue = value === '' ? '' : Number(value);

        // 점수가 배점을 초과하는지 확인
        if (numValue !== '' && numValue > maxScore) {
            alert(`점수는 배점(${maxScore}점)을 초과할 수 없습니다.`);
            return;
        }

        setFormData(prev => ({
            ...prev,
            scores: {
                ...prev.scores,
                [scoreType]: numValue
            }
        }));
    };

    const handleSubmit = () => {
        console.log('프로젝트 킥오프 체크리스트 저장:', formData);
        console.log('총점:', totalScore);
        console.log('등급:', grade);
        // TODO: API 연동
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="kickoff-checklist-container">
            {/* 헤더 */}
            <div className="checklist-header">
                <div>
                    <h1 className="checklist-title">
                        프로젝트 킥오프 체크리스트
                    </h1>
                </div>
                <div className="checklist-logo">
                    GMCOM
                </div>
            </div>

            {/* 메인 체크리스트 섹션 */}
            <div className="checklist-main">
                <div className="checklist-title-section">
                    <h2 className="checklist-subtitle">
                        - 정보 수집 -
                    </h2>
                    <div className="checklist-writer">
                        <div className="writer-form">
                            <div className="writer-field">
                                <label className="writer-field-label">등록자 이름:</label>
                                <input
                                    type="text"
                                    name="writerName"
                                    value={formData.writerName}
                                    onChange={handleInputChange}
                                    placeholder="홍길동"
                                    className="writer-field-input"
                                />
                            </div>
                            <div className="writer-field">
                                <label className="writer-field-label">부서:</label>
                                <input
                                    type="text"
                                    name="writerDepartment"
                                    value={formData.writerDepartment}
                                    onChange={handleInputChange}
                                    placeholder="영업팀"
                                    className="writer-field-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 프로젝트 체크사항 (8x4 테이블) */}
                <div className="checklist-section">
                    <h3 className="section-header">
                        ■ 프로젝트 체크사항
                    </h3>

                    <table className="checklist-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                            <td className="table-header weight-header">배점</td>
                            <td className="table-header score-header">점수</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">매출액 및 이익</td>
                            <td className="table-cell table-cell-content">
                                <div className="bullet-content">
                                    • 예상 매출규모의 충분성<br/>
                                    • 예상 수익률의 적정성
                                </div>
                            </td>
                            <td className="table-cell table-cell-weight">50</td>
                            <td className="table-cell-input">
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={formData.scores.revenue}
                                    onChange={(e) => handleScoreChange('revenue', e.target.value, 50)}
                                    className="checklist-score-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">실행가능성</td>
                            <td className="table-cell table-cell-content">
                                <div className="bullet-content">
                                    • 수주가능성 : 유착관계, 당사 리스크 등<br/>
                                    • 당사 동원 인력의 역량 및 활용상황
                                </div>
                            </td>
                            <td className="table-cell table-cell-weight">20</td>
                            <td className="table-cell-input">
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={formData.scores.feasibility}
                                    onChange={(e) => handleScoreChange('feasibility', e.target.value, 20)}
                                    className="checklist-score-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">RFP 검토</td>
                            <td className="table-cell table-cell-content">
                                <div className="bullet-content">
                                    • 참여조건, 심사기준 등의 적합성<br/>
                                    • 당사 단독 준비 가능여부, 협업 필요성등<br/>
                                    • 수주 가능성 분석 : 유착관계, 당사 리스크 등
                                </div>
                            </td>
                            <td className="table-cell table-cell-weight">10</td>
                            <td className="table-cell-input">
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={formData.scores.rfpReview}
                                    onChange={(e) => handleScoreChange('rfpReview', e.target.value, 10)}
                                    className="checklist-score-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">미래가치성</td>
                            <td className="table-cell table-cell-content">
                                <div className="bullet-content">
                                    • 클라이언트 브랜드 시장가치<br/>
                                    • 향후 반복수주의 가능성
                                </div>
                            </td>
                            <td className="table-cell table-cell-weight">10</td>
                            <td className="table-cell-input">
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={formData.scores.futureValue}
                                    onChange={(e) => handleScoreChange('futureValue', e.target.value, 10)}
                                    className="checklist-score-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">관계성</td>
                            <td className="table-cell table-cell-content">
                                <div className="bullet-content">
                                    • 이전 년도 프로젝트 정보 수집<br/>
                                    • 최근 2년간 클라이언트와의 관계성<br/>
                                    • 당사와의 관계성
                                </div>
                            </td>
                            <td className="table-cell table-cell-weight">10</td>
                            <td className="table-cell-input">
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={formData.scores.relationship}
                                    onChange={(e) => handleScoreChange('relationship', e.target.value, 10)}
                                    className="checklist-score-input"
                                />
                            </td>
                        </tr>
                        <tr className="total-row">
                            <td className="table-cell table-cell-merged" colSpan={2}>총점</td>
                            <td className="table-cell table-cell-weight">100</td>
                            <td className="table-cell table-cell-total">
                                {totalScore !== null ? totalScore : '-'}
                            </td>
                        </tr>
                        <tr className="grade-row">
                            <td className="table-cell table-cell-merged" colSpan={2}>
                                종합 등급 ( C:~70 B:~80 A:~100 )
                            </td>
                            <td className="table-cell table-cell-dash">-</td>
                            <td className="table-cell table-cell-grade">
                                {grade && (
                                    <span className={`grade-badge grade-${grade.toLowerCase()}`}>
                                        {grade}
                                    </span>
                                )}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 체크사항에 따른 의견 (2x2 테이블) */}
                <div className="checklist-section">
                    <h3 className="section-header">
                        ■ 체크사항에 따른 의견
                    </h3>

                    <table className="checklist-table opinion-table">
                        <tbody>
                        <tr>
                            <td className="table-cell table-cell-label opinion-label">담당자 의견</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="managerOpinion"
                                    value={formData.managerOpinion}
                                    onChange={handleInputChange}
                                    className="checklist-textarea textarea-large"
                                    placeholder="프로젝트에 대한 전반적인 의견을 입력해주세요..."
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label opinion-label">담당자 평가</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="managerEvaluation"
                                    value={formData.managerEvaluation}
                                    onChange={handleInputChange}
                                    className="checklist-textarea textarea-large"
                                    placeholder="프로젝트 진행에 대한 최종 평가를 입력해주세요..."
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 버튼 영역 */}
                <div className="button-section">
                    <button onClick={handleSubmit} className="submit-btn">
                        저장
                    </button>
                    <button onClick={handlePrint} className="print-btn">
                        인쇄
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectKickoffChecklistForm;