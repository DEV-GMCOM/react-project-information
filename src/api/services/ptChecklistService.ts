// src/api/services/ptChecklistService.ts
import { apiClient } from '../utils/apiClient';

export interface PTChecklistItem {
    checked: boolean;
    opinion: string;
}

export interface PTChecklistRequest {
    project_id: number;
    department?: string;
    presenter?: string;
    professional_understanding?: PTChecklistItem;
    concept_strategy?: PTChecklistItem;
    feasibility?: PTChecklistItem;
    proposal_completeness?: PTChecklistItem;
    safety_management?: PTChecklistItem;
    event_plan?: PTChecklistItem;
    organization_structure?: PTChecklistItem;
    performance_record?: PTChecklistItem;
    pricing_adequacy?: PTChecklistItem;
    additional_proposals?: PTChecklistItem;
    persuasiveness?: PTChecklistItem;
    strategic_performance?: PTChecklistItem;
    qa_preparation?: PTChecklistItem;
    presenter_attitude?: PTChecklistItem;
    writer_name?: string;
    writer_department?: string;
}

export interface PTChecklistResponse extends PTChecklistRequest {
    id: number;
    created_at: string;
    updated_at?: string;
}

export class PTChecklistService {
    async getPTChecklist(projectId: number): Promise<PTChecklistResponse> {
        const response = await apiClient.get(`/pt-checklists/${projectId}`);
        return response.data;
    }

    async createOrUpdatePTChecklist(data: PTChecklistRequest): Promise<PTChecklistResponse> {
        const response = await apiClient.post('/pt-checklists/', data);
        return response.data;
    }
}

export const ptChecklistService = new PTChecklistService();