// ProjectPostmortem.tsx - 타입 수정 및 개선된 버전
import React, { useState, useEffect } from 'react';
import '../../styles/ProjectPostmortem.css';
import ProjectBasicInfoForm from "../../components/common/ProjectBasicInfoForm.tsx";
import { ExtendedProjectData } from '../../types/project';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/utils/apiClient';
import { useHelp } from '../../contexts/HelpContext';


// API 연동을 위한 interface 추가
interface ProjectPostmortemApiData {
    // 프로젝트 실행 후 보고
    execution_date: string;
    internal_department: string;
    internal_team: Array<{
        category: string;
        details: string;
    }>;
    external_partners: Array<{
        category: string;
        details: string;
    }>;

    // 실행 후 평가
    quantitative_evaluation: string;
    qualitative_evaluation: string;
    issues_and_improvements: string;
    manager_opinion: string;

    // 메타데이터
    writer_name: string;
    writer_department: string;
}

interface ProjectPostmortemData {
    // 프로젝트 기본 정보 (PTPostmortem과 동일한 포맷)
    projectName: string;
    inflowRoute: string;
    client: string;
    manager: string;
    eventDate: string;
    eventLocation: string;
    attendeeInfo: string;
    eventType: string;
    otSchedule: string;
    ptSchedule: string;
    expectedRevenue: string;
    expectedCompetitors: string;
    scoreTable: string;
    bidAmount: string;

    // 프로젝트 상세 정보 (Profile 토글)
    purposeBackground?: string;
    mainContent?: string;
    coreRequirements?: string;
    comparison?: string;

    // 프로젝트 검토 (Profile 토글)
    swotAnalysis?: string;
    direction?: string;
    resourcePlan?: string;
    writerOpinion?: string;

    // 프로젝트 착수 보고 (Kickoff 토글)
    department?: string;
    presenter?: string;
    personnel?: string;
    collaboration?: string;
    plannedExpense?: string;
    progressSchedule?: string;
    riskFactors?: string;
    nextReport?: string;

    // PT 결과 분석 (PT Postmortem 토글)
    ptReview?: string;
    ptResult?: string;
    reason?: string;
    directionConcept?: string;
    program?: string;
    operation?: string;
    quotation?: string;
    ptManagerOpinion?: string;

    // 프로젝트 실행 후 보고
    executionDate: string;
    internalDepartment: string;
    internalTeam: Array<{
        category: string;
        details: string;
    }>;
    externalPartners: Array<{
        category: string;
        details: string;
    }>;

    // 실행 후 평가
    quantitativeEvaluation: string;
    qualitativeEvaluation: string;
    issuesAndImprovements: string;
    managerOpinion: string;

    // 메타데이터
    writerName: string;
    writerDepartment: string;
}

const ProjectPostmortemForm: React.FC = () => {
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [showProfileTables, setShowProfileTables] = useState(false);
    const [showKickoffTables, setShowKickoffTables] = useState(false);
    const [showPTPostmortemTables, setShowPTPostmortemTables] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<number | null>(null);

    // ProjectBasicInfoForm용 상태 추가
    const [basicFormData, setBasicFormData] = useState<ExtendedProjectData>({
        projectName: '',
        inflowPath: '',
        client: '',
        manager: '',
        eventDate: '',
        eventLocation: '',
        attendees: '',
        eventNature: '',
        otSchedule: '',
        submissionSchedule: '',
        expectedRevenue: '',
        expectedCompetitors: '',
        scoreTable: '',
        bidAmount: '',
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        writerName: '',
        writerDepartment: ''
    });

    const [formData, setFormData] = useState<ProjectPostmortemData>({
        projectName: '',
        inflowRoute: '',
        client: '',
        manager: '',
        eventDate: '',
        eventLocation: '',
        attendeeInfo: '',
        eventType: '',
        otSchedule: '',
        ptSchedule: '',
        expectedRevenue: '',
        expectedCompetitors: '',
        scoreTable: '',
        bidAmount: '',
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        swotAnalysis: '',
        direction: '',
        resourcePlan: '',
        writerOpinion: '',
        department: '',
        presenter: '',
        personnel: '',
        collaboration: '',
        plannedExpense: '',
        progressSchedule: '',
        riskFactors: '',
        nextReport: '',
        ptReview: '',
        ptResult: '',
        reason: '',
        directionConcept: '',
        program: '',
        operation: '',
        quotation: '',
        ptManagerOpinion: '',
        executionDate: '',
        internalDepartment: '',
        internalTeam: [{ category: '', details: '' }],
        externalPartners: [{ category: '', details: '' }],
        quantitativeEvaluation: '',
        qualitativeEvaluation: '',
        issuesAndImprovements: '',
        managerOpinion: '',
        writerName: '',
        writerDepartment: ''
    });

    //***************************************************************************************************
    // 아래 내용 반드시 바뀌어야 한다. 서버의 테이블에 저장된 값으로 가져와 동적으로 배정하고, 또한 응답값을 동적으로 분류되도록..
    //***************************************************************************************************
    const internalCategories = ['기획', 'Proj 메인', '무대 및 연출', '인력', '제작'];
    const externalCategories = ['무대', '전시', '영상장비', '음향', '영상제작', '조명', '음악제작', 'VJ', '진행인력', '경호', '렌탈', '기타'];

    // // API 호출 함수들
    // const apiCall = async (url: string, options?: RequestInit) => {
    //     const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001'}${url}`, {
    //         headers: {
    //             'Content-Type': 'application/json',
    //             ...options?.headers,
    //         },
    //         ...options,
    //     });
    //
    //     if (!response.ok) {
    //         const errorData = await response.json().catch(() => ({ detail: '알 수 없는 오류가 발생했습니다.' }));
    //         throw new Error(errorData.detail || `API 오류: ${response.status}`);
    //     }
    //
    //     return response.json();
    // };

    const { setHelpContent } = useHelp();

    useEffect(() => {
        setHelpContent({
            pageName: '프로젝트 사후 분석',
            content: (
                <>
                    <div className="help-section">
                        <h3>📋 프로젝트 사후 분석(Postmortem) 가이드</h3>
                        <p>
                            완료된 프로젝트에 대한 종합적인 회고와 분석을 통해
                            교훈을 도출하고 향후 프로젝트 개선에 활용하기 위한 문서입니다.
                        </p>
                    </div>

                    <div className="help-section">
                        <h3>🔍 프로젝트 선택 및 정보 확인</h3>
                        <ul>
                            <li><strong>프로젝트 검색:</strong> 완료된 프로젝트를 검색하여 선택합니다.</li>
                            <li><strong>연관 정보 토글:</strong> 프로젝트 프로파일, 착수보고, 실행 현황을 확인할 수 있습니다.</li>
                            <li><strong>기존 데이터 로드:</strong> 이전에 작성한 사후 분석이 있으면 자동으로 로드됩니다.</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📝 사후 분석 작성 항목</h3>

                        <p><strong>1. 프로젝트 개요 및 최종 결과:</strong></p>
                        <ul>
                            <li>프로젝트 목표 및 범위 요약</li>
                            <li>최종 납품 산출물 목록</li>
                            <li>프로젝트 완료일 (계획 vs 실제)</li>
                            <li>클라이언트 최종 검수 결과</li>
                            <li>계약 조건 이행 여부</li>
                        </ul>

                        <p><strong>2. 일정 분석:</strong></p>
                        <ul>
                            <li><strong>계획 대비 실적:</strong>
                                <ul>
                                    <li>예정 기간 vs 실제 소요 기간</li>
                                    <li>주요 마일스톤별 지연/단축 분석</li>
                                </ul>
                            </li>
                            <li><strong>지연 원인:</strong>
                                <ul>
                                    <li>요구사항 변경</li>
                                    <li>기술적 난이도</li>
                                    <li>리소스 부족</li>
                                    <li>의사결정 지연</li>
                                    <li>외부 요인 (클라이언트, 협력사 등)</li>
                                </ul>
                            </li>
                            <li><strong>일정 단축 요인:</strong>
                                <ul>
                                    <li>효율적인 프로세스</li>
                                    <li>팀워크 및 숙련도</li>
                                    <li>재사용 가능한 자산 활용</li>
                                </ul>
                            </li>
                        </ul>

                        <p><strong>3. 예산 분석:</strong></p>
                        <ul>
                            <li><strong>예산 집행 결과:</strong>
                                <ul>
                                    <li>총 예산 대비 실제 집행액</li>
                                    <li>항목별 예산 대비 실적 (인건비, 외주비, 경비 등)</li>
                                    <li>예산 초과/절감 항목 및 금액</li>
                                </ul>
                            </li>
                            <li><strong>수익성 분석:</strong>
                                <ul>
                                    <li>매출액 (계약금액)</li>
                                    <li>총 비용</li>
                                    <li>영업이익 및 이익률</li>
                                    <li>목표 대비 달성률</li>
                                </ul>
                            </li>
                            <li><strong>예산 변동 요인:</strong>
                                <ul>
                                    <li>범위 변경에 따른 추가 비용</li>
                                    <li>예상치 못한 비용 발생</li>
                                    <li>효율화를 통한 비용 절감</li>
                                </ul>
                            </li>
                        </ul>

                        <p><strong>4. 품질 분석:</strong></p>
                        <ul>
                            <li><strong>결함 및 이슈:</strong>
                                <ul>
                                    <li>발견된 총 결함 수</li>
                                    <li>심각도별 분포</li>
                                    <li>단계별 발견율 (개발, 테스트, 운영 등)</li>
                                    <li>미해결 이슈 및 향후 조치 계획</li>
                                </ul>
                            </li>
                            <li><strong>품질 지표:</strong>
                                <ul>
                                    <li>코드 품질 (복잡도, 중복도 등)</li>
                                    <li>테스트 커버리지</li>
                                    <li>성능 지표 달성 여부</li>
                                    <li>보안 취약점 점검 결과</li>
                                </ul>
                            </li>
                            <li><strong>클라이언트 만족도:</strong>
                                <ul>
                                    <li>최종 검수 평가 결과</li>
                                    <li>클라이언트 피드백 요약</li>
                                    <li>추가 요청 또는 불만 사항</li>
                                </ul>
                            </li>
                        </ul>

                        <p><strong>5. 팀 및 인력 분석:</strong></p>
                        <ul>
                            <li><strong>투입 인력:</strong>
                                <ul>
                                    <li>계획 대비 실제 투입 인력</li>
                                    <li>총 투입 M/D (Man/Day)</li>
                                    <li>역할별 투입 현황</li>
                                </ul>
                            </li>
                            <li><strong>팀 구성 평가:</strong>
                                <ul>
                                    <li>적정 인력 규모 여부</li>
                                    <li>역량 및 경험 수준 적합성</li>
                                    <li>팀 구성 변경 이력 및 영향</li>
                                </ul>
                            </li>
                            <li><strong>협업 및 커뮤니케이션:</strong>
                                <ul>
                                    <li>내부 팀워크 평가</li>
                                    <li>클라이언트와의 협업</li>
                                    <li>협력사와의 조율</li>
                                    <li>커뮤니케이션 이슈 및 개선 사항</li>
                                </ul>
                            </li>
                        </ul>

                        <p><strong>6. 기술 및 방법론 평가:</strong></p>
                        <ul>
                            <li><strong>기술 스택:</strong>
                                <ul>
                                    <li>채택한 기술의 적절성</li>
                                    <li>기술적 난이도 및 학습 곡선</li>
                                    <li>기술 관련 이슈 및 해결 과정</li>
                                    <li>향후 권장/비권장 기술</li>
                                </ul>
                            </li>
                            <li><strong>개발 방법론:</strong>
                                <ul>
                                    <li>적용한 방법론 (Agile, Waterfall 등)</li>
                                    <li>방법론의 효과성</li>
                                    <li>프로세스 준수도</li>
                                    <li>개선이 필요한 프로세스</li>
                                </ul>
                            </li>
                            <li><strong>도구 및 인프라:</strong>
                                <ul>
                                    <li>사용한 개발/협업 도구</li>
                                    <li>인프라 환경 (개발, 테스트, 운영)</li>
                                    <li>도구 및 인프라의 적절성</li>
                                </ul>
                            </li>
                        </ul>

                        <p><strong>7. 리스크 및 이슈 분석:</strong></p>
                        <ul>
                            <li><strong>사전 식별 리스크:</strong>
                                <ul>
                                    <li>착수보고 시 식별한 리스크의 실제 발생 여부</li>
                                    <li>대응 계획의 효과성</li>
                                </ul>
                            </li>
                            <li><strong>신규 발생 리스크:</strong>
                                <ul>
                                    <li>예상하지 못한 리스크 목록</li>
                                    <li>발생 원인 및 대응 과정</li>
                                    <li>영향도 및 손실</li>
                                </ul>
                            </li>
                            <li><strong>주요 이슈:</strong>
                                <ul>
                                    <li>프로젝트 중 발생한 중대 이슈</li>
                                    <li>해결 과정 및 소요 시간</li>
                                    <li>재발 방지 대책</li>
                                </ul>
                            </li>
                        </ul>

                        <p><strong>8. 성공 요인 (What Went Well):</strong></p>
                        <ul>
                            <li>프로젝트 성공에 기여한 주요 요인</li>
                            <li>효과적이었던 의사결정</li>
                            <li>우수했던 프로세스나 활동</li>
                            <li>잘 작동한 기술이나 도구</li>
                            <li>팀의 강점</li>
                            <li>향후 벤치마킹할 사례</li>
                        </ul>

                        <p><strong>9. 개선 필요 사항 (What Could Be Improved):</strong></p>
                        <ul>
                            <li>아쉬웠거나 부족했던 부분</li>
                            <li>비효율적이었던 프로세스</li>
                            <li>반복된 문제점</li>
                            <li>역량 부족 영역</li>
                            <li>커뮤니케이션 문제</li>
                            <li>다음 프로젝트에서 개선할 사항</li>
                        </ul>

                        <p><strong>10. 교훈 (Lessons Learned):</strong></p>
                        <ul>
                            <li>프로젝트를 통해 얻은 핵심 교훈</li>
                            <li>Do's: 반드시 해야 할 것들</li>
                            <li>Don'ts: 피해야 할 것들</li>
                            <li>향후 유사 프로젝트 수행 시 권장 사항</li>
                            <li>조직 차원의 개선 제안</li>
                        </ul>

                        <p><strong>11. 후속 조치 및 액션 아이템:</strong></p>
                        <ul>
                            <li><strong>즉시 조치 사항:</strong>
                                <ul>
                                    <li>미해결 이슈 처리</li>
                                    <li>추가 개선 작업</li>
                                    <li>문서 정리 및 인수인계</li>
                                </ul>
                            </li>
                            <li><strong>장기 개선 과제:</strong>
                                <ul>
                                    <li>프로세스 개선</li>
                                    <li>역량 강화 교육</li>
                                    <li>도구 및 인프라 개선</li>
                                </ul>
                            </li>
                            <li>각 액션 아이템별 담당자 및 기한 지정</li>
                        </ul>

                        <p><strong>12. 팀원 의견 수렴:</strong></p>
                        <ul>
                            <li>PM 의견</li>
                            <li>개발팀 의견</li>
                            <li>디자인팀 의견</li>
                            <li>QA팀 의견</li>
                            <li>팀원들의 개별 회고 내용 요약</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📊 활용 방안</h3>
                        <ul>
                            <li><strong>지식 자산화:</strong> 조직의 프로젝트 수행 노하우 축적</li>
                            <li><strong>프로세스 개선:</strong> 반복적인 문제 해결 및 체계 개선</li>
                            <li><strong>역량 강화:</strong> 교육 및 코칭 자료로 활용</li>
                            <li><strong>제안 고도화:</strong> 향후 유사 프로젝트 제안 시 참고</li>
                            <li><strong>리스크 예방:</strong> 신규 프로젝트의 리스크 관리에 활용</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📎 첨부파일</h3>
                        <ul>
                            <li><strong>최종 산출물:</strong> 프로젝트 결과물</li>
                            <li><strong>품질 보고서:</strong> 테스트 결과, 결함 리포트 등</li>
                            <li><strong>회고 미팅 자료:</strong> 팀 회고 회의록</li>
                            <li><strong>통계 자료:</strong> 각종 지표 및 차트</li>
                        </ul>
                    </div>

                    <div className="help-tip">
                        <strong>💡 TIP:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            <li>프로젝트 종료 후 2주 이내에 작성하여 기억이 생생할 때 정리하세요.</li>
                            <li>팀원들과 함께 회고 미팅을 진행한 후 작성하면 더 풍부한 내용이 됩니다.</li>
                            <li>객관적인 데이터(일정, 예산, 품질 지표)를 기반으로 분석하세요.</li>
                            <li>개선 사항은 구체적이고 실행 가능한 액션 아이템으로 도출하세요.</li>
                        </ul>
                    </div>

                    <div className="help-warning">
                        <strong>⚠️ 주의사항:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            <li>실패나 문제점을 개인 탓으로 돌리지 말고 시스템과 프로세스 관점에서 분석하세요.</li>
                            <li>성공 요인과 실패 요인을 균형있게 다루어 편향된 분석을 피하세요.</li>
                            <li>교훈은 추상적이지 않고 구체적으로 작성하여 실제 활용 가능하도록 하세요.</li>
                            <li>민감한 정보나 개인 정보는 적절히 보호하여 기록하세요.</li>
                        </ul>
                    </div>
                </>
            )
        });

        return () => {
            setHelpContent(null);
        };
    }, [setHelpContent]);

    // 날짜 형식 변환 함수 추가 (파일 상단에)
    const formatDateForInput = (dateString: string | null): string => {
        if (!dateString) return '';

        // "2025-10-10" → "2025.10.10" 또는 input에 맞는 형식으로
        // 만약 input type="date"라면 "2025-10-10" 그대로 사용
        // 만약 일반 text input이라면 원하는 형식으로 변환

        // 하이픈을 점으로 변환하는 경우:
        return dateString.replace(/-/g, '.');
    };

    // 프로젝트 Postmortem 데이터 로드
    const loadPostmortemData = async (projectId: number) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get(`/projects/${projectId}/proj-postmortem`);
            const data = response.data;

            console.log('📥 백엔드에서 받은 데이터:', data);  // 디버깅용

            if (data && data.postmortem) {
                const postmortem = data.postmortem;

                // 🔥 available_parts로 category ID → 이름 매핑 생성
                const categoryIdToName: { [key: number]: string } = {};
                (data.available_parts || []).forEach((part: any) => {
                    categoryIdToName[part.category] = part.name;
                });
                console.log('📋 Category 매핑:', categoryIdToName);

                // teams를 category 기준으로 내부팀과 외부협력사로 분리
                const internalTeams = (data.teams || [])
                    .filter((t: any) => t.category < 100)
                    .map((t: any) => ({
                        category: categoryIdToName[t.category] || String(t.category),  // ✅ ID → 이름 변환
                        details: t.details || ''
                    }));

                const externalPartners = (data.teams || [])
                    .filter((t: any) => t.category >= 100)
                    .map((t: any) => ({
                        category: categoryIdToName[t.category] || String(t.category),  // ✅ ID → 이름 변환
                        details: t.details || ''
                    }));

                console.log('✅ 내부팀:', internalTeams);
                console.log('✅ 외부협력사:', externalPartners);


                // 백엔드 데이터를 프론트엔드 형식으로 변환
                setFormData(prev => ({
                    ...prev,
                    executionDate: formatDateForInput(postmortem.execution_date),
                    internalDepartment: postmortem.internal_department || '',
                    internalTeam: internalTeams.length > 0 ? internalTeams : [{ category: '', details: '' }],
                    externalPartners: externalPartners.length > 0 ? externalPartners : [{ category: '', details: '' }],
                    quantitativeEvaluation: postmortem.quantitative_evaluation || '',
                    qualitativeEvaluation: postmortem.qualitative_evaluation || '',
                    issuesAndImprovements: postmortem.issues_and_improvements || '',
                    managerOpinion: postmortem.manager_opinion || '',
                    writerName: postmortem.writer_name || '',
                    writerDepartment: postmortem.writer_department || ''
                }));

                console.log('✅ 데이터 로드 완료');
            } else {
                // 데이터가 없을 때 초기화
                console.log('ℹ️  저장된 데이터 없음 - 초기화');
                setFormData(prev => ({
                    ...prev,
                    executionDate: '',
                    internalDepartment: '',
                    internalTeam: [{ category: '', details: '' }],
                    externalPartners: [{ category: '', details: '' }],
                    quantitativeEvaluation: '',
                    qualitativeEvaluation: '',
                    issuesAndImprovements: '',
                    managerOpinion: '',
                    writerName: '',
                    writerDepartment: ''
                }));
            }
        } catch (err: any) {
            console.error('❌ Postmortem 데이터 로드 오류:', err);
            // 404는 데이터가 없는 것이므로 에러로 처리하지 않음
            if (err.response?.status === 404) {
                setFormData(prev => ({
                    ...prev,
                    executionDate: '',
                    internalDepartment: '',
                    internalTeam: [{ category: '', details: '' }],
                    externalPartners: [{ category: '', details: '' }],
                    quantitativeEvaluation: '',
                    qualitativeEvaluation: '',
                    issuesAndImprovements: '',
                    managerOpinion: '',
                    writerName: '',
                    writerDepartment: ''
                }));
                return;
            }
            setError(err instanceof Error ? err.message : 'Postmortem 데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 프로젝트 Postmortem 데이터 저장
    const savePostmortemData = async (projectId: number, data: ProjectPostmortemData) => {
        // // 프론트엔드 데이터를 백엔드 API 형식으로 변환
        // const apiData: ProjectPostmortemApiData = {
        //     execution_date: data.executionDate,
        //     internal_department: data.internalDepartment,
        //     internal_team: data.internalTeam,
        //     external_partners: data.externalPartners,
        //     quantitative_evaluation: data.quantitativeEvaluation,
        //     qualitative_evaluation: data.qualitativeEvaluation,
        //     issues_and_improvements: data.issuesAndImprovements,
        //     manager_opinion: data.managerOpinion,
        //     writer_name: data.writerName,
        //     writer_department: data.writerDepartment
        // };
        //
        // return await apiCall(`/api/projects/${projectId}/postmortem`, {
        //     method: 'PUT',
        //     body: JSON.stringify(apiData),
        // });
        try {
            // 프론트엔드 데이터를 백엔드 API 형식으로 변환
            const apiData: ProjectPostmortemApiData = {
                execution_date: data.executionDate,
                internal_department: data.internalDepartment,
                internal_team: data.internalTeam,
                external_partners: data.externalPartners,
                quantitative_evaluation: data.quantitativeEvaluation,
                qualitative_evaluation: data.qualitativeEvaluation,
                issues_and_improvements: data.issuesAndImprovements,
                manager_opinion: data.managerOpinion,
                writer_name: data.writerName,
                writer_department: data.writerDepartment
            };

            const response = await apiClient.post(`/projects/${projectId}/proj-postmortem`, apiData);
            return response.data;
        } catch (error) {
            console.error('Postmortem 저장 오류:', error);
            throw error;
        }
    };

    // 프로젝트 ID가 변경될 때 데이터 로드
    useEffect(() => {
        if (projectId) {
            loadPostmortemData(projectId);
        }
    }, [projectId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 텍스트에 자동으로 bullet point 추가하는 함수
    const formatWithBullets = (text: string): string => {
        if (!text) return text;

        const lines = text.split('\n');
        return lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
                return `• ${trimmedLine}`;
            }
            return line;
        }).join('\n');
    };

    const handleBulletTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const formattedValue = formatWithBullets(value);
        setFormData(prev => ({
            ...prev,
            [name]: formattedValue
        }));
    };

    const handleTeamChange = (index: number, field: 'category' | 'details', value: string) => {
        setFormData(prev => ({
            ...prev,
            internalTeam: prev.internalTeam.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handlePartnerChange = (index: number, field: 'category' | 'details', value: string) => {
        setFormData(prev => ({
            ...prev,
            externalPartners: prev.externalPartners.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const addTeamRow = () => {
        if (formData.internalTeam.length < 10) {
            setFormData(prev => ({
                ...prev,
                internalTeam: [...prev.internalTeam, { category: '', details: '' }]
            }));
        }
    };

    const addPartnerRow = () => {
        if (formData.externalPartners.length < 15) {
            setFormData(prev => ({
                ...prev,
                externalPartners: [...prev.externalPartners, { category: '', details: '' }]
            }));
        }
    };

    // 저장 버튼 핸들러 - 개선된 버전
    const handleSubmit = async () => {
        if (!projectId) {
            alert('프로젝트가 선택되지 않았습니다.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await savePostmortemData(projectId, formData);

            // 1. 최신 데이터 다시 로드
            await loadPostmortemData(projectId);

            // 2. alert로 명확한 피드백
            alert('Project Postmortem이 성공적으로 저장되었습니다.');

            // 3. 배너도 표시 (선택사항)
            setSuccessMessage('Project Postmortem이 성공적으로 저장되었습니다.');
            setTimeout(() => setSuccessMessage(null), 3000);

            // 4. 스크롤을 맨 위로 이동
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('저장 오류:', err);
            const errorMessage = err instanceof Error ? err.message : 'Project Postmortem 저장 중 오류가 발생했습니다.';
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // ProjectBasicInfoForm 핸들러들
    const handleBasicInfoChange = (name: keyof ExtendedProjectData, value: string) => {
        setBasicFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProjectIdSelected = (selectedProjectId: number) => {
        setProjectId(selectedProjectId);
    };

    const handleToggleStateChange = (isOpen: boolean) => {
        setShowProfileTables(isOpen);
    };

    const [showKickoff, setShowKickoff] = useState(false);
    const [showPTPostmortem, setShowPTPostmortem] = useState(false);
    const [showProjPostmortem, setShowProjPostmortem] = useState(false);

    return (
        <div className="project-postmortem-container">
            {/* 헤더 */}
            <div className="postmortem-header">
                <div>
                    <h1 className="postmortem-title">
                        별첨 2-5. Project Postmortem
                    </h1>
                </div>
                <div className="postmortem-logo">
                    GMCOM
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="postmortem-main">
                {/* 성공 메시지 표시 */}
                {successMessage && (
                    <div className="success-banner" style={{
                        padding: '15px',
                        marginBottom: '20px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        textAlign: 'center'
                    }}>
                        {successMessage}
                    </div>
                )}

                {/* 로딩 및 에러 상태 표시 */}
                {loading && (
                    <div className="loading-indicator">
                        데이터를 처리 중입니다...
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        오류: {error}
                    </div>
                )}

                <div className="postmortem-title-section">
                    <h2 className="postmortem-subtitle">
                        프로젝트 실행결과 사후분석
                    </h2>
                    <div className="profile-writer">
                        <div className="writer-form">
                            <div>
                                최종 작성자 :
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-main">
                    {/* ProjectBasicInfoForm 컴포넌트 - 기본/상세 정보 관리 */}
                    <ProjectBasicInfoForm
                        formData={basicFormData}
                        readOnly={true}
                        // onChange={handleBasicInfoChange}

                        showSearch={true}
                        onProjectIdSelected={handleProjectIdSelected}

                        // Project Profile
                        enableDetailSectionToggle={true}
                        showDetailSection={showProfileTables}
                        onDetailSectionChange={handleToggleStateChange}

                        // Project Kickoff
                        enableKickoffSectionToggle={true}
                        showKickoffSection={showKickoff}
                        onKickoffSectionChange={setShowKickoff}

                        // PT Postmortem
                        enablePTPostmortemSectionToggle={true}
                        showPTPostmortemSection={showPTPostmortem}
                        onPTPostmortemSectionChange={setShowPTPostmortem}

                        // // Project Postmortem
                        // enableProjectPostmortemSectionToggle={true}
                        // showProjectPostmortemSection={showProjPostmortem}
                        // onProjectPostmortemSectionChange={setShowProjPostmortem}

                        includeDataSections={["basic", "detail"]}
                        className="project-section"
                        tableClassName="project-table"
                        inputClassName="project-input"
                    />
                </div>

                {/*/!* 세 개의 토글 버튼 섹션 *!/*/}
                {/*<div className="table-action-section">*/}
                {/*    <button*/}
                {/*        type="button"*/}
                {/*        className="toggle-profile-btn"*/}
                {/*        onClick={() => setShowProfileTables(!showProfileTables)}*/}
                {/*    >*/}
                {/*        Project Profile {showProfileTables ? '숨기기' : '보기'}*/}
                {/*    </button>*/}
                {/*    <button*/}
                {/*        type="button"*/}
                {/*        className="toggle-profile-btn"*/}
                {/*        onClick={() => setShowKickoffTables(!showKickoffTables)}*/}
                {/*    >*/}
                {/*        Project Kickoff {showKickoffTables ? '숨기기' : '보기'}*/}
                {/*    </button>*/}
                {/*    <button*/}
                {/*        type="button"*/}
                {/*        className="toggle-profile-btn"*/}
                {/*        onClick={() => setShowPTPostmortemTables(!showPTPostmortemTables)}*/}
                {/*    >*/}
                {/*        PT Postmortem {showPTPostmortemTables ? '숨기기' : '보기'}*/}
                {/*    </button>*/}
                {/*</div>*/}

                {/*/!* 프로젝트 상세 정보 (Profile 토글) *!/*/}
                {/*<div*/}
                {/*    className={`profile-tables-container ${showProfileTables ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}*/}
                {/*    style={{*/}
                {/*        opacity: showProfileTables ? 1 : 0,*/}
                {/*        maxHeight: showProfileTables ? '2000px' : '0',*/}
                {/*        transform: showProfileTables ? 'translateY(0)' : 'translateY(-20px)',*/}
                {/*        marginBottom: showProfileTables ? '0' : '0',*/}
                {/*        transition: 'all 1s ease-in-out'*/}
                {/*    }}*/}
                {/*>*/}
                {/*    {showProfileTables && (*/}
                {/*        <>*/}
                {/*            <div className="postmortem-section">*/}
                {/*                <h3 className="section-header">*/}
                {/*                    ■ 프로젝트 상세 정보*/}
                {/*                </h3>*/}
                {/*                <table className="postmortem-table">*/}
                {/*                    <tbody>*/}
                {/*                    <tr>*/}
                {/*                        <td className="table-header">구분</td>*/}
                {/*                        <td className="table-header">내용</td>*/}
                {/*                    </tr>*/}
                {/*                    <tr>*/}
                {/*                        <td className="table-cell table-cell-label">목적 및 배경</td>*/}
                {/*                        <td className="table-cell-input">*/}
                {/*                            <textarea*/}
                {/*                                name="purposeBackground"*/}
                {/*                                value={formData.purposeBackground}*/}
                {/*                                onChange={handleInputChange}*/}
                {/*                                className="postmortem-textarea textarea-medium"*/}
                {/*                            />*/}
                {/*                        </td>*/}
                {/*                    </tr>*/}
                {/*                    <tr>*/}
                {/*                        <td className="table-cell table-cell-label">주요 내용</td>*/}
                {/*                        <td className="table-cell-input">*/}
                {/*                            <textarea*/}
                {/*                                name="mainContent"*/}
                {/*                                value={formData.mainContent}*/}
                {/*                                onChange={handleBulletTextChange}*/}
                {/*                                placeholder="프로젝트 Profile 토대로 수정/변경/업데이트 가능"*/}
                {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                            />*/}
                {/*                        </td>*/}
                {/*                    </tr>*/}
                {/*                    <tr>*/}
                {/*                        <td className="table-cell table-cell-label">핵심 요구사항</td>*/}
                {/*                        <td className="table-cell-input">*/}
                {/*                            <textarea*/}
                {/*                                name="coreRequirements"*/}
                {/*                                value={formData.coreRequirements}*/}
                {/*                                onChange={handleBulletTextChange}*/}
                {/*                                placeholder="프로젝트 Profile 토대로 수정/변경/업데이트 가능"*/}
                {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                            />*/}
                {/*                        </td>*/}
                {/*                    </tr>*/}
                {/*                    <tr>*/}
                {/*                        <td className="table-cell table-cell-label">비고</td>*/}
                {/*                        <td className="table-cell-input">*/}
                {/*                            <textarea*/}
                {/*                                name="comparison"*/}
                {/*                                value={formData.comparison}*/}
                {/*                                onChange={handleInputChange}*/}
                {/*                                className="postmortem-textarea textarea-medium"*/}
                {/*                            />*/}
                {/*                        </td>*/}
                {/*                    </tr>*/}
                {/*                    </tbody>*/}
                {/*                </table>*/}
                {/*            </div>*/}

                {/*            /!* 프로젝트 검토 테이블 *!/*/}
                {/*            <div className="postmortem-section">*/}
                {/*                <h3 className="section-header">*/}
                {/*                    ■ 프로젝트 검토*/}
                {/*                </h3>*/}
                {/*                <table className="postmortem-table">*/}
                {/*                    <tbody>*/}
                {/*                    <tr>*/}
                {/*                        <td className="table-header">구분</td>*/}
                {/*                        <td className="table-header">내용</td>*/}
                {/*                    </tr>*/}
                {/*                    <tr>*/}
                {/*                        <td className="table-cell table-cell-label">SWOT 분석</td>*/}
                {/*                        <td className="table-cell-input">*/}
                {/*                            <textarea*/}
                {/*                                name="swotAnalysis"*/}
                {/*                                value={formData.swotAnalysis}*/}
                {/*                                onChange={handleBulletTextChange}*/}
                {/*                                placeholder="경쟁사 대비 강점과 약점, 기회요인과 위협요인 분석"*/}
                {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                            />*/}
                {/*                        </td>*/}
                {/*                    </tr>*/}
                {/*                    <tr>*/}
                {/*                        <td className="table-cell table-cell-label">방향성</td>*/}
                {/*                        <td className="table-cell-input">*/}
                {/*                            <textarea*/}
                {/*                                name="direction"*/}
                {/*                                value={formData.direction}*/}
                {/*                                onChange={handleBulletTextChange}*/}
                {/*                                placeholder="PT 컨셉, 프로그램 구성 등"*/}
                {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                            />*/}
                {/*                        </td>*/}
                {/*                    </tr>*/}
                {/*                    <tr>*/}
                {/*                        <td className="table-cell table-cell-label">자원계획</td>*/}
                {/*                        <td className="table-cell-input">*/}
                {/*                            <textarea*/}
                {/*                                name="resourcePlan"*/}
                {/*                                value={formData.resourcePlan}*/}
                {/*                                onChange={handleBulletTextChange}*/}
                {/*                                placeholder="팀구성, 외주업체, 투입비용"*/}
                {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                            />*/}
                {/*                        </td>*/}
                {/*                    </tr>*/}
                {/*                    <tr>*/}
                {/*                        <td className="table-cell table-cell-label">작성자 의견</td>*/}
                {/*                        <td className="table-cell-input">*/}
                {/*                            <textarea*/}
                {/*                                name="writerOpinion"*/}
                {/*                                value={formData.writerOpinion}*/}
                {/*                                onChange={handleBulletTextChange}*/}
                {/*                                placeholder="프로젝트 진행여부 판단 의견 요약"*/}
                {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                            />*/}
                {/*                        </td>*/}
                {/*                    </tr>*/}
                {/*                    </tbody>*/}
                {/*                </table>*/}
                {/*            </div>*/}
                {/*        </>*/}
                {/*    )}*/}
                {/*</div>*/}

                {/*/!* 프로젝트 착수 보고 (Kickoff 토글) *!/*/}
                {/*<div*/}
                {/*    className={`profile-tables-container ${showKickoffTables ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}*/}
                {/*    style={{*/}
                {/*        opacity: showKickoffTables ? 1 : 0,*/}
                {/*        maxHeight: showKickoffTables ? '2000px' : '0',*/}
                {/*        transform: showKickoffTables ? 'translateY(0)' : 'translateY(-20px)',*/}
                {/*        marginBottom: showKickoffTables ? '0' : '0',*/}
                {/*        transition: 'all 1s ease-in-out'*/}
                {/*    }}*/}
                {/*>*/}
                {/*    {showKickoffTables && (*/}
                {/*        <div className="postmortem-section">*/}
                {/*            <h3 className="section-header">*/}
                {/*                ■ 프로젝트 착수보고*/}
                {/*            </h3>*/}
                {/*            <table className="postmortem-table">*/}
                {/*                <tbody>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-header">구분</td>*/}
                {/*                    <td className="table-header">내용</td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">담당부서</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="department"*/}
                {/*                            value={formData.department}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            placeholder="X본부 Y팀"*/}
                {/*                            className="postmortem-textarea textarea-small bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">PT발표자</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <input*/}
                {/*                            type="text"*/}
                {/*                            name="presenter"*/}
                {/*                            value={formData.presenter}*/}
                {/*                            onChange={handleInputChange}*/}
                {/*                            className="postmortem-input"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">*/}
                {/*                        투입인력 및<br/>*/}
                {/*                        역할, 기여도*/}
                {/*                    </td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="personnel"*/}
                {/*                            value={formData.personnel}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            placeholder="메인 XXX PM ( 기여도 YY% 예정 )&#10;서브 XXX PM ( 기여도 YY% 예정 )&#10;서브 XXX PM ( 기여도 YY% 예정 )"*/}
                {/*                            className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">협업조직</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="collaboration"*/}
                {/*                            value={formData.collaboration}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            placeholder="키비주얼 : 디자인팀&#10;3D 디자인 : XX 사&#10;영상 : 영상팀"*/}
                {/*                            className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">기획 예상경비</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="plannedExpense"*/}
                {/*                            value={formData.plannedExpense}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            placeholder="출장, 야근택시비, 용역비 등"*/}
                {/*                            className="postmortem-textarea textarea-medium bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">*/}
                {/*                        진행 일정<br/>*/}
                {/*                        (마일스톤)*/}
                {/*                    </td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="progressSchedule"*/}
                {/*                            value={formData.progressSchedule}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            placeholder="주차별 또는 월별 주요 일정"*/}
                {/*                            className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">위험요소</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="riskFactors"*/}
                {/*                            value={formData.riskFactors}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            placeholder="예상되는 리스크와 대응방안"*/}
                {/*                            className="postmortem-textarea textarea-medium bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">차기 보고</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="nextReport"*/}
                {/*                            value={formData.nextReport}*/}
                {/*                            onChange={handleInputChange}*/}
                {/*                            placeholder="다음 보고 예정일과 내용"*/}
                {/*                            className="postmortem-textarea textarea-small"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                </tbody>*/}
                {/*            </table>*/}
                {/*        </div>*/}
                {/*    )}*/}
                {/*</div>*/}

                {/*/!* PT 결과 분석 (PT Postmortem 토글) *!/*/}
                {/*<div*/}
                {/*    className={`profile-tables-container ${showPTPostmortemTables ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}*/}
                {/*    style={{*/}
                {/*        opacity: showPTPostmortemTables ? 1 : 0,*/}
                {/*        maxHeight: showPTPostmortemTables ? '2000px' : '0',*/}
                {/*        transform: showPTPostmortemTables ? 'translateY(0)' : 'translateY(-20px)',*/}
                {/*        marginBottom: showPTPostmortemTables ? '0' : '0',*/}
                {/*        transition: 'all 1s ease-in-out'*/}
                {/*    }}*/}
                {/*>*/}
                {/*    {showPTPostmortemTables && (*/}
                {/*        <div className="postmortem-section">*/}
                {/*            <h3 className="section-header">*/}
                {/*                ■ PT 결과 분석*/}
                {/*            </h3>*/}
                {/*            <table className="postmortem-table">*/}
                {/*                <tbody>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-header">구분</td>*/}
                {/*                    <td className="table-header">내용</td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">PT 내용 Review</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="ptReview"*/}
                {/*                            value={formData.ptReview}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            placeholder="발표 과정, 질의응답, 분위기 등"*/}
                {/*                            className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">PT 결과</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <input*/}
                {/*                            type="text"*/}
                {/*                            name="ptResult"*/}
                {/*                            value={formData.ptResult}*/}
                {/*                            onChange={handleInputChange}*/}
                {/*                            placeholder="낙찰 / 탈락"*/}
                {/*                            className="postmortem-input"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">이유</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="reason"*/}
                {/*                            value={formData.reason}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            placeholder="성공/실패 요인 분석"*/}
                {/*                            className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">방향성 / 컨셉</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="directionConcept"*/}
                {/*                            value={formData.directionConcept}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            className="postmortem-textarea textarea-medium bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">프로그램</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="program"*/}
                {/*                            value={formData.program}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            className="postmortem-textarea textarea-medium bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">연출</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="operation"*/}
                {/*                            value={formData.operation}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            className="postmortem-textarea textarea-medium bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">견적</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="quotation"*/}
                {/*                            value={formData.quotation}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            className="postmortem-textarea textarea-medium bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">담당PM 의견</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="ptManagerOpinion"*/}
                {/*                            value={formData.ptManagerOpinion}*/}
                {/*                            onChange={handleBulletTextChange}*/}
                {/*                            placeholder="향후 개선사항, 교훈 등"*/}
                {/*                            className="postmortem-textarea textarea-large bullet-textarea"*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                </tbody>*/}
                {/*            </table>*/}
                {/*        </div>*/}
                {/*    )}*/}
                {/*</div>*/}

                {/* 프로젝트 실행 후 보고 */}
                <div className="postmortem-section">
                    <h3 className="section-header section-header-margin">
                        ■ 프로젝트 실행 후 보고
                    </h3>

                    <table className="postmortem-table-customized">
                        <colgroup>
                            <col style={{width: '120px'}} />
                            <col style={{width: '120px'}} />
                            <col />
                        </colgroup>
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header" colSpan={2}>내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">실행일</td>
                            <td className="table-cell-input" colSpan={2}>
                                <input
                                    type="date"
                                    name="executionDate"
                                    value={formData.executionDate ? formData.executionDate.replace(/\./g, '-') : ''}
                                    onChange={(e) => {
                                        const selectedDate = e.target.value;
                                        if (selectedDate) {
                                            const formattedDate = selectedDate.replace(/-/g, '.');
                                            setFormData(prev => ({ ...prev, executionDate: formattedDate }));
                                        } else {
                                            setFormData(prev => ({ ...prev, executionDate: '' }));
                                        }
                                    }}
                                    className="postmortem-date-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">내부 담당부서</td>
                            <td className="table-cell-input" colSpan={2}>
                                <input
                                    type="text"
                                    name="internalDepartment"
                                    value={formData.internalDepartment}
                                    onChange={handleInputChange}
                                    className="postmortem-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-rowspan" rowSpan={formData.internalTeam.length + 1}>
                                내부팀
                            </td>
                            <td className="table-cell table-cell-label dropdown-cell">구분</td>
                            <td className="table-cell table-cell-label add-button-cell">
                                내용
                                <button
                                    type="button"
                                    onClick={addTeamRow}
                                    className="add-row-btn"
                                    disabled={formData.internalTeam.length >= 10}
                                >
                                    행 추가
                                </button>
                            </td>
                        </tr>
                        {formData.internalTeam.map((team, index) => (
                            <tr key={`team-${index}`}>
                                <td className="table-cell-input dropdown-cell">
                                    <select
                                        value={team.category}
                                        onChange={(e) => handleTeamChange(index, 'category', e.target.value)}
                                        className="postmortem-select"
                                    >
                                        <option value="">선택</option>
                                        {internalCategories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="table-cell-input">
                                    <input
                                        type="text"
                                        value={team.details}
                                        onChange={(e) => handleTeamChange(index, 'details', e.target.value)}
                                        className="postmortem-input"
                                    />
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td className="table-cell table-cell-rowspan" rowSpan={formData.externalPartners.length + 1}>
                                외부 협력업체
                            </td>
                            <td className="table-cell table-cell-label dropdown-cell">구분</td>
                            <td className="table-cell table-cell-label add-button-cell">
                                내용
                                <button
                                    type="button"
                                    onClick={addPartnerRow}
                                    className="add-row-btn"
                                    disabled={formData.externalPartners.length >= 15}
                                >
                                    행 추가
                                </button>
                            </td>
                        </tr>
                        {formData.externalPartners.map((partner, index) => (
                            <tr key={`partner-${index}`}>
                                <td className="table-cell-input dropdown-cell">
                                    <select
                                        value={partner.category}
                                        onChange={(e) => handlePartnerChange(index, 'category', e.target.value)}
                                        className="postmortem-select"
                                    >
                                        <option value="">선택</option>
                                        {externalCategories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="table-cell-input">
                                    <input
                                        type="text"
                                        value={partner.details}
                                        onChange={(e) => handlePartnerChange(index, 'details', e.target.value)}
                                        className="postmortem-input"
                                    />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* 실행 후 평가 (5x2 테이블) */}
                <div className="postmortem-section">
                    <h3 className="section-header section-header-margin">
                        ■ 실행 후 평가
                    </h3>

                    <table className="postmortem-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">정량적 평가</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="quantitativeEvaluation"
                                    value={formData.quantitativeEvaluation}
                                    onChange={handleInputChange}
                                    placeholder="• 참석률, 만족도, 매출 등 수치화 가능한 평가"
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">정성적 평가</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="qualitativeEvaluation"
                                    value={formData.qualitativeEvaluation}
                                    onChange={handleInputChange}
                                    placeholder="• 브랜드 이미지 향상, 고객 반응, 미디어 노출 등"
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">이슈 및 개선사항</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="issuesAndImprovements"
                                    value={formData.issuesAndImprovements}
                                    onChange={handleInputChange}
                                    placeholder="• 발생한 문제점과 향후 개선 방안"
                                    className="postmortem-textarea textarea-large"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">담당자 의견</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="managerOpinion"
                                    value={formData.managerOpinion}
                                    onChange={handleInputChange}
                                    placeholder="• 전체적인 프로젝트 평가 및 의견"
                                    className="postmortem-textarea textarea-large"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 버튼 영역 */}
                <div className="button-section">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectPostmortemForm;