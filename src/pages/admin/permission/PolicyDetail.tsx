import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../../styles/PolicyDetail.css';

// Mock data - reusing the same list from the previous page to find the resource name.
const manageableResources = [
  { id: 'meeting-minutes', name: '음성 회의록' },
  { id: 'project-kickoff', name: '프로젝트 착수서' },
  { id: 'uploaded-files', name: '업로드 파일' },
  { id: 'project-checklist', name: '프로젝트 체크리스트' },
  { id: 'result-analysis', name: '결과 분석 보고서' },
];

/**
 * PolicyDetail Component
 *
 * Displays the detailed access policy for a specific resource, identified by a URL parameter.
 * The policy itself is a static representation of the backend logic.
 */
const PolicyDetail: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const resource = manageableResources.find(r => r.id === resourceId);

  if (!resource) {
    return (
      <div className="policy-detail-container">
        <h1>정책을 찾을 수 없음</h1>
        <p>선택한 리소스에 대한 정책을 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/admin/permission/policy')} className="back-button">
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="policy-detail-container">
      <button onClick={() => navigate('/admin/permission/policy')} className="back-button">
        &larr; 리소스 선택으로 돌아가기
      </button>
      <h1>{resource.name}: 접근 권한 정책</h1>
      <p className="policy-description">
        '{resource.name}' 리소스의 접근 권한은 사용자의 조직(본부, 팀)과 직책(본부장, 팀장, 팀원)에 따라 아래의 규칙에 의해 자동으로 결정됩니다.
      </p>

      <div className="policy-card">
        <h2>기본 규칙</h2>
        <ul>
          <li>리소스에 <strong>'공유 대상'</strong>으로 명시된 사용자는 항상 접근할 수 있습니다.</li>
        </ul>
      </div>

      <div className="policy-card">
        <h2>조직 내 접근 규칙</h2>
        <table className="policy-table">
          <thead>
            <tr>
              <th>사용자 역할</th>
              <th>대상 리소스 (작성자 기준)</th>
              <th>접근 수준</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>팀원</td>
              <td>같은 팀 소속 팀원의 리소스</td>
              <td className="access-full"><strong>읽기 가능</strong></td>
            </tr>
            <tr>
              <td>팀원</td>
              <td>같은 본부, 다른 팀 소속 팀원의 리소스</td>
              <td className="access-list">목록/제목만 보기</td>
            </tr>
            <tr>
              <td>팀장</td>
              <td>같은 본부 소속 모든 팀원의 리소스</td>
              <td className="access-full"><strong>읽기 가능</strong></td>
            </tr>
             <tr>
              <td>팀원</td>
              <td>다른 본부 소속 팀원의 리소스</td>
              <td className="access-none">접근 불가</td>
            </tr>
            <tr>
              <td>팀장</td>
              <td>다른 본부 소속 팀원의 리소스</td>
              <td className="access-list">목록/제목만 보기</td>
            </tr>
            <tr>
              <td>본부장</td>
              <td>모든 본부의 모든 리소스</td>
              <td className="access-full"><strong>읽기 가능 (전체)</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
       <div className="policy-footer">
          <p>이 정책은 시스템에 내장되어 있으며, 현재 UI를 통해 수정할 수 없습니다. 정책 변경이 필요한 경우 시스템 관리자에게 문의하세요.</p>
      </div>
    </div>
  );
};

export default PolicyDetail;
