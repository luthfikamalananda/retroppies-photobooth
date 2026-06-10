import { apiClient, BaseResponse } from "./apiClient";

interface TimerParams {
    tenantId: number;
    keyword: string;
    page: number;
    limit: number;
}

export interface ResultRules {
    rules: Timer[];
    total: number;
}

export interface Timer {
    id: number;
    rulesType: string;
    value: number;
    tenantId: number;
    tenantName: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
}

export async function getTimerTransaction(req: TimerParams): Promise<BaseResponse<ResultRules>> {
    await apiClient.post('/rules/get', req)
    try {
        const res = await apiClient.post<BaseResponse<ResultRules>>('/rules/get', req, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Basic ' + btoa(`photobox:PhotoBox123@`)
            },
        })
        return res.data
    } catch (error) {
        throw error
    }
}
