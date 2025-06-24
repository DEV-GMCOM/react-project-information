// src/api/services/companyService.ts
import { apiClient } from '../utils/apiClient';
import { Company, CompanyCreate, CompanyUpdate, CompanySearchParams } from '../types';

export class CompanyService {
    async getCompanies(params?: CompanySearchParams): Promise<Company[]> {
        const response = await apiClient.get('/company/', { params });
        return response.data;
    }

    async getCompany(id: number): Promise<Company> {
        const response = await apiClient.get(`/company/${id}`);
        return response.data;
    }

    async createCompany(data: CompanyCreate): Promise<Company> {
        const response = await apiClient.post('/company/', data);
        return response.data;
    }

    async updateCompany(id: number, data: CompanyUpdate): Promise<Company> {
        const response = await apiClient.put(`/company/${id}`, data);
        return response.data;
    }

    async deleteCompany(id: number): Promise<void> {
        await apiClient.delete(`/company/${id}`);
    }

    async validateBusinessNumber(businessNumber: string): Promise<{
        is_valid: boolean;
        is_duplicate: boolean;
        message: string;
    }> {
        const response = await apiClient.post('/company/validate-business-number', {
            business_number: businessNumber
        });
        return response.data;
    }

    async searchCompanies(query: string): Promise<Company[]> {
        const response = await apiClient.get('/company/search', {
            params: { q: query }
        });
        return response.data;
    }
}

// 인스턴스 export (중요!)
export const companyService = new CompanyService();
