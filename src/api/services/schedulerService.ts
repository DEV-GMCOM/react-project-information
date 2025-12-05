import { apiClient } from '../utils/apiClient';

export interface SchedulerJob {
    id: string;
    name: string;
    next_run_time: string;
    trigger: string;
    executor: string;
    args: any[];
    kwargs: Record<string, any>;
}

export const schedulerService = {
    async getJobs(): Promise<SchedulerJob[]> {
        const response = await apiClient.get('/scheduler/jobs');
        return response.data;
    }
};