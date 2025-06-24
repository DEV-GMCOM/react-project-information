import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// import { companyService } from '@/api';  // ✅ 수정
// import type { Company } from '@/api';  // ✅ 수정

import { companyService } from '../../api';  // ✅ 수정
import type { Company } from '../../api/types';  // ✅ 추가

import '../../styles/CompanyList.css';

const CompanyList: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');

    useEffect(() => {
        loadCompanies();
    }, [searchTerm, selectedIndustry]);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const data = await companyService.getCompanies({
                search: searchTerm || undefined,
                industry: selectedIndustry || undefined,
                limit: 100
            });
            setCompanies(data);
        } catch (err: any) {
            setError('업체 목록을 불러오는데 실패했습니다.');
            console.error('Companies loading error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, companyName: string) => {
        if (!window.confirm(`"${companyName}" 업체를 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await companyService.deleteCompany(id);
            setCompanies(companies.filter(company => company.id !== id));
            alert('업체가 삭제되었습니다.');
        } catch (err: any) {
            alert('업체 삭제에 실패했습니다: ' + (err.response?.data?.detail || err.message));
        }
    };

    const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];

    return (
        <div className="company-list">
            <div className="page-header">
                <h1>업체 관리</h1>
                <Link to="/company/new" className="btn btn-primary">
                    새 업체 등록
                </Link>
                <br/>
                <Link to="/company/regist" className="btn btn-primary">
                    GMCOM 클라이언트 등록
                </Link>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="업체명 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                        className="industry-select"
                    >
                        <option value="">모든 업종</option>
                        {industries.map(industry => (
                            <option key={industry} value={industry}>{industry}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && <div className="loading">로딩 중...</div>}
            {error && <div className="error">{error}</div>}

            {!loading && !error && (
                <div className="company-grid">
                    {companies.length === 0 ? (
                        <div className="no-data">등록된 업체가 없습니다.</div>
                    ) : (
                        companies.map(company => (
                            <div key={company.id} className="company-card">
                                <div className="company-header">
                                    <h3>{company.company_name}</h3>
                                    <div className="company-actions">
                                        <Link
                                            to={`/company/${company.id}/edit`}
                                            className="btn btn-sm btn-secondary"
                                        >
                                            수정
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(company.id, company.company_name)}
                                            className="btn btn-sm btn-danger"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                                <div className="company-details">
                                    {company.business_number && (
                                        <p><strong>사업자번호:</strong> {company.business_number}</p>
                                    )}
                                    {company.industry && (
                                        <p><strong>업종:</strong> {company.industry}</p>
                                    )}
                                    {company.phone && (
                                        <p><strong>전화:</strong> {company.phone}</p>
                                    )}
                                    {company.email && (
                                        <p><strong>이메일:</strong> {company.email}</p>
                                    )}
                                    {company.address && (
                                        <p><strong>주소:</strong> {company.address}</p>
                                    )}
                                </div>
                                <div className="company-meta">
                                    <small>등록일: {new Date(company.created_at).toLocaleDateString()}</small>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default CompanyList;