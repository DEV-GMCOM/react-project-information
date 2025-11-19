import React, { useState } from 'react';
import '../../../styles/AbacBuilder.css';
import RuleBuilder, { Rule } from '../../../components/admin/permission/RuleBuilder';

// This is a prototype component. State is managed locally and is not persisted.

// Mock data for attributes that can be used in rules.
const USER_ATTRIBUTES = [
  { id: 'user.position', name: '사용자 직책' },
  { id: 'user.department', name: '사용자 부서' },
  { id: 'user.division', name: '사용자 본부' },
  { id: 'user.role.role_code', name: '사용자 역할 코드' },
];

const RESOURCE_ATTRIBUTES = [
  { id: 'resource.owner.department', name: '리소스 소유자 부서' },
  { id: 'resource.owner.division', name: '리소스 소유자 본부' },
  { id: 'resource.sensitivity', name: '리소스 보안 등급' },
];

const AbacBuilder: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [policyName, setPolicyName] = useState('');
  const [nextRuleId, setNextRuleId] = useState(1);

  const addRule = () => {
    const newRule: Rule = {
      id: nextRuleId,
      attribute: '',
      operator: 'EQUALS',
      value: '',
    };
    setRules([...rules, newRule]);
    setNextRuleId(nextRuleId + 1);
  };

  const removeRule = (idToRemove: number) => {
    setRules(rules.filter(rule => rule.id !== idToRemove));
  };

  const updateRule = (updatedRule: Rule) => {
    setRules(rules.map(rule => (rule.id === updatedRule.id ? updatedRule : rule)));
  };

  const handleSavePolicy = () => {
    // In a real application, this would send the structured policy data to the backend.
    alert(`(Prototype) Policy "${policyName}" saved with ${rules.length} rules. Check console for data.`);
    console.log({
      policyName,
      rules,
    });
  };

  return (
    <div className="policy-builder-container">
      <div className="policy-builder-header">
        <h1>ABAC 정책 빌더 (프로토타입)</h1>
        <p>속성 기반 접근 제어(ABAC) 규칙을 정의하여 리소스 접근 정책을 생성합니다.</p>
      </div>

      <div className="policy-form">
        <div className="form-group">
          <label htmlFor="policy-name">정책 이름</label>
          <input
            id="policy-name"
            type="text"
            value={policyName}
            onChange={(e) => setPolicyName(e.target.value)}
            placeholder="예: 팀장 문서 접근 정책"
          />
        </div>

        <div className="rules-engine">
          <h2>규칙 정의</h2>
          <p>아래 조건들이 모두 'AND'로 연결되어 일치할 경우 접근이 허용됩니다.</p>
          
          <div className="rules-list">
            {rules.length === 0 ? (
              <p className="no-rules-text">정의된 규칙이 없습니다. "새 규칙 추가" 버튼을 눌러 시작하세요.</p>
            ) : (
              rules.map(rule => (
                <RuleBuilder
                  key={rule.id}
                  rule={rule}
                  onUpdate={updateRule}
                  onRemove={removeRule}
                  userAttributes={USER_ATTRIBUTES}
                  resourceAttributes={RESOURCE_ATTRIBUTES}
                />
              ))
            )}
          </div>

          <button onClick={addRule} className="add-rule-btn">
            + 새 규칙 추가
          </button>
        </div>

        <div className="policy-actions">
          <button onClick={handleSavePolicy} className="save-policy-btn" disabled={!policyName || rules.length === 0}>
            정책 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default AbacBuilder;
