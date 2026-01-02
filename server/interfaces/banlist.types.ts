export interface BanEntry {
    id: number;
    uuid: string;
    uuid_nickname?: string; // Добавлен никнейм забаненного пользователя
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

/**
 * Публичный тип для API ответа (без персональных данных)
 */
export interface BanEntryPublic {
    id: number;
    uuid: string;
    uuid_nickname?: string;
    reason: string;
    banned_by_name: string;
    removed_by_name: string | null;
    removed_by_reason: string | null;
    removed_by_date: string | null;
    time: number;
    until: number;
    template: number;
    server_scope: string;
    silent: number;
    ipban: number;
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