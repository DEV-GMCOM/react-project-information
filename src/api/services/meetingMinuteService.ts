// ✅ [신규] src/api/services/meetingMinuteService.ts

import apiClient from '../utils/apiClient';
import { MeetingMinute } from '../types';

// 임시 파라미터 타입 (필요시 확장)
interface GetMeetingsParams {
    limit?: number;
    offset?: number;
    search?: string;
}

const meetingMinuteService = {
    /**
     * 내가 작성한 회의록 목록을 가져옵니다.
     */
    async getMyMeetings(params: GetMeetingsParams = {}): Promise<MeetingMinute[]> {
        // TODO: 백엔드 엔드포인트 확인 필요
        const response = await apiClient.get<MeetingMinute[]>('/api/v1/meeting-minutes/my', { params });
        return response.data;
    },

    /**
     * 나에게 공유된 회의록 목록을 가져옵니다.
     */
    async getSharedMeetings(params: GetMeetingsParams = {}): Promise<MeetingMinute[]> {
        // TODO: 백엔드 엔드포인트 확인 필요
        const response = await apiClient.get<MeetingMinute[]>('/api/v1/meeting-minutes/shared', { params });
        return response.data;
    },

    /**
     * 특정 회의록의 상세 정보를 가져옵니다. (파일, STT, LLM 결과 포함)
     * (지금 당장 필요하진 않지만, 향후 상세 로직을 위해 추가)
     */
    async getMeetingDetails(meetingId: number): Promise<MeetingMinute> {
        const response = await apiClient.get<MeetingMinute>(`/api/v1/meeting-minutes/${meetingId}`);
        return response.data;
    }
};

export { meetingMinuteService };