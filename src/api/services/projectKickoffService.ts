// src/api/services/projectKickoffService.ts (신규 파일)
import { apiClient } from '../utils/apiClient';
import { ProjectKickoff } from '../types'; // 💡 ProjectKickoff 타입 정의가 필요합니다. (src/api/types.ts)

export class ProjectKickoffService {
    // 착수보고 정보 조회 (필요 시 구현)
    async getKickoff(projectId: number): Promise<ProjectKickoff> {
        const response = await apiClient.get(`/projects/${projectId}/kickoff`);
        return response.data;
    }

    // 착수보고 생성 또는 수정
    async upsertKickoff(projectId: number, data: Partial<ProjectKickoff>): Promise<ProjectKickoff> {
        const response = await apiClient.put(`/projects/${projectId}/kickoff`, data);
        return response.data;
    }
}

export const projectKickoffService = new ProjectKickoffService();