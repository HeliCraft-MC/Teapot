export interface BanEntry {
    id: number;
    uuid: string;
    ip: string | null;
    reason: string;
    banned_by_uuid: string;
    banned_by_name: string;
    removed_by_uuid: string | null;
    removed_by_name: string | null;
    removed_by_reason: string | null;
    removed_by_date: string | null;
    time: number;
    until: number;
    template: number;
    server_scope: string;
    server_origin: string | null;
    silent: number;
    ipban: number;
    ipban_wildcard: number;
    active: number;
}

export interface CreateBanDto {
    targetUuid: string;
    targetIp?: string;
    reason: string;
    adminUuid: string;
    adminName: string;
    durationMs: number;
    isIpBan?: boolean;
    silent?: boolean;
}