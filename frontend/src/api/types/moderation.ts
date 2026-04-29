// src/api/types/moderation.ts
export interface ModerationResponse {
    id: string;
    commit_id: string;
    reason?: string;
    description?: string;
    status: 'pending' | 'resolved' | 'rejected';
    reported_by: string;
    moderated_by?: string;
    comment?: string;
    created_at: string;
    moderated_at?: string;
}

export interface ModerationUpdate {
    status?: string;
    comment?: string;
    revert_commit?: boolean;
}