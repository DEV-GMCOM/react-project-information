// src/api/services/meetingMinuteService.ts

import apiClient from '../utils/apiClient';
import { MeetingMinute } from '../types';

// 파라미터 타입
interface GetMeetingsParams {
    limit?: number;
    skip?: number;
    offset?: number;
    search?: string;
    project_id?: number;
    has_project?: boolean; // true: 프로젝트 연계만, false: 독립형, undefined: 전체
}

const meetingMinuteService = {
    /**
     * 내가 작성한 회의록 목록을 가져옵니다.
     */
    async getMyMeetings(params: GetMeetingsParams = {}): Promise<MeetingMinute[]> {
        const response = await apiClient.get<MeetingMinute[]>('/meeting-minutes/my-created', { params });
        return response.data;
    },

    /**
     * 나에게 공유된 회의록 목록을 가져옵니다.
     */
    async getSharedMeetings(params: GetMeetingsParams = {}): Promise<MeetingMinute[]> {
        const response = await apiClient.get<MeetingMinute[]>('/meeting-minutes/shared-with-me', { params });
        return response.data;
    },

    /**
     * 부서(팀) 회의록 목록을 가져옵니다.
     */
    async getDepartmentMeetings(params: GetMeetingsParams = {}): Promise<MeetingMinute[]> {
        const response = await apiClient.get<MeetingMinute[]>('/meeting-minutes/department', { params });
        return response.data;
    },

    /**
     * 전체 회의록 목록을 가져옵니다. (관리자용)
     */
    async getAllMeetings(params: GetMeetingsParams = {}): Promise<MeetingMinute[]> {
        const response = await apiClient.get<MeetingMinute[]>('/meeting-minutes/all', { params });
        return response.data;
    },

    /**
     * 회의록 개수를 조회합니다.
     */
    async getMeetingsCount(type: 'my' | 'shared' | 'dept' | 'all', params: GetMeetingsParams = {}): Promise<number> {
        const response = await apiClient.get<{ total_count: number }>('/meeting-minutes/count', {
            params: { ...params, type }
        });
        return response.data.total_count;
    },

    /**
     * 내가 참석한 회의록 목록
     */
    async getAttendedMeetings(params: GetMeetingsParams = {}): Promise<MeetingMinute[]> {
        // ✅ 추가
        const response = await apiClient.get<MeetingMinute[]>('/meeting-minutes/attended', { params });
        return response.data;
    },

    /**
     * 특정 회의록의 상세 정보를 가져옵니다. (파일, STT, LLM 결과 포함)
     */
    async getMeetingDetails(meetingId: number): Promise<MeetingMinute> {
        const response = await apiClient.get<MeetingMinute>(`/meeting-minutes/${meetingId}`);
        return response.data;
    },

    /**
     * 회의록 생성
     */
    async createMeeting(data: any): Promise<MeetingMinute> {
        // ✅ 추가
        const response = await apiClient.post<MeetingMinute>('/meeting-minutes/', data);
        return response.data;
    },

    /**
     * 회의록 수정
     */
    async updateMeeting(meetingId: number, data: any): Promise<MeetingMinute> {
        // ✅ 추가
        const response = await apiClient.put<MeetingMinute>(`/meeting-minutes/${meetingId}`, data);
        return response.data;
    },

    /**
     * 회의록 삭제
     */
    // async deleteMeeting(meetingId: number): Promise<void> {
    //     // ✅ 추가
    //     await apiClient.delete(`/meeting-minutes/${meetingId}`);
    // },
    async deleteMeeting(meetingId: number): Promise<void> {
        try {
            await apiClient.delete(`/meeting-minutes/${meetingId}`);
        } catch (error) {
            console.error('회의록 삭제 실패:', error);
            throw error;
        }
    },

    /**
     * 회의록 통계
     */
    async getStats(): Promise<any> {
        // ✅ 추가
        const response = await apiClient.get('/meeting-minutes/stats/summary');
        return response.data;
    }
};

export { meetingMinuteService };