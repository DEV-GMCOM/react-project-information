import React from 'react';
import '../../../styles/RuleBuilder.css';

export interface Rule {
  id: number;
  attribute: string;
  operator: string;
  value: string;
}

interface Attribute {
  id: string;
  name: string;
}

interface RuleBuilderProps {
  rule: Rule;
  onUpdate: (updatedRule: Rule) => void;
  onRemove: (id: number) => void;
  userAttributes: Attribute[];
  resourceAttributes: Attribute[];
}

const OPERATORS = [
  { id: 'EQUALS', name: '같음 (==)' },
  { id: 'NOT_EQUALS', name: '같지 않음 (!=)' },
  { id: 'CONTAINS', name: '포함함' },
  { id: 'GREATER_THAN', name: '보다 큼 (>)' },
  { id: 'LESS_THAN', name: '보다 작음 (<)' },
];

const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rule,
  onUpdate,
  onRemove,
  userAttributes,
  resourceAttributes,
}) => {
  const handleAttributeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ ...rule, attribute: e.target.value });
  };

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ ...rule, operator: e.target.value });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...rule, value: e.target.value });
  };

  return (
    <div className="rule-builder">
      <select
        className="rule-select"
        value={rule.attribute}
        onChange={handleAttributeChange}
      >
        <option value="" disabled>속성 선택...</option>
        <optgroup label="사용자 속성">
          {userAttributes.map(attr => (
            <option key={attr.id} value={attr.id}>{attr.name}</option>
          ))}
        </optgroup>
        <optgroup label="리소스 속성">
          {resourceAttributes.map(attr => (
            <option key={attr.id} value={attr.id}>{attr.name}</option>
          ))}
        </optgroup>
      </select>

      <select
        className="rule-select"
        value={rule.operator}
        onChange={handleOperatorChange}
      >
        <option value="" disabled>연산자 선택...</option>
        {OPERATORS.map(op => (
          <option key={op.id} value={op.id}>{op.name}</option>
        ))}
      </select>

      <input
        type="text"
        className="rule-input"
        value={rule.value}
        onChange={handleValueChange}
        placeholder="비교할 값 입력..."
      />

      <button onClick={() => onRemove(rule.id)} className="remove-rule-btn" title="규칙 삭제">
        &times;
      </button>
    </div>
  );
};

export default RuleBuilder;
