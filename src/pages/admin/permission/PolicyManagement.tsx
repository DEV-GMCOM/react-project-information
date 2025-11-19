import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/PolicyManagement.css';

// Mock data for manageable resources. In a real application, this might come from a configuration file or an API.
const manageableResources = [
  {
    id: 'meeting-minutes',
    name: '음성 회의록',
    description: '사용자가 생성한 음성 기반 회의록입니다.',
  },
  {
    id: 'project-kickoff',
    name: '프로젝트 착수서',
    description: '프로젝트 시작 시 작성되는 공식 문서입니다.',
  },
  {
    id: 'uploaded-files',
    name: '업로드 파일',
    description: '프로젝트 및 과업 중 업로드된 일반 파일입니다.',
  },
  {
    id: 'project-checklist',
    name: '프로젝트 체크리스트',
    description: '프로젝트 진행 상태를 점검하는 데 사용되는 체크리스트입니다.',
  },
  {
    id: 'result-analysis',
    name: '결과 분석 보고서',
    description: '프로젝트 완료 후 작성되는 결과 분석 자료입니다.',
  },
];

/**
 * PolicyManagement Component
 *
 * This is the main entry point for managing access policies.
 * It displays a list of resource types for which policies can be viewed.
 */
const PolicyManagement: React.FC = () => {
  const navigate = useNavigate();

  const handleResourceSelect = (resourceId: string) => {
    // Navigate to the detail page for the selected resource
    navigate(`/admin/permission/policy/${resourceId}`);
  };

  return (
    <div className="policy-management-container">
      <h1>접근 정책 관리</h1>
      <p className="page-description">
        관리할 리소스를 선택하세요. 각 리소스에 적용되는 상세 접근 권한 정책을 확인할 수 있습니다.
      </p>
      <div className="resource-list">
        {manageableResources.map((resource) => (
          <div
            key={resource.id}
            className="resource-card"
            onClick={() => handleResourceSelect(resource.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleResourceSelect(resource.id)}
          >
            <h2 className="resource-name">{resource.name}</h2>
            <p className="resource-description">{resource.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PolicyManagement;
