import { useMySQL } from "~/plugins/mySql"; // Путь к твоему плагину
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { BanEntry, BanEntryPublic, CreateBanDto } from "~/interfaces/banlist.types";
import { deleteSkin } from "./skin.utils";
import { getUserByUUID } from "./user.utils";

/**
 * Имя подключения в конфиге. 
 * Убедись, что в nitro.config.ts / runtimeConfig есть database: { banlist: { ... } }
 */
const CONNECTION_NAME = 'banlist';

/* ──────────────────────────────── helpers ──────────────────────────────── */

/** * Простой валидатор, чтобы не вставлять мусор.
 * Можно расширить или импортировать из auth утилит.
 */
function normalizeUuid(raw: string): string {
    return raw.replace(/-/g, '').toLowerCase();
}

/* ────────────────────────────── main utils ─────────────────────────────── */

/**
 * Добавить никнейм пользователя к объекту бана
 */
async function enrichBanWithNickname(ban: BanEntry): Promise<BanEntry> {
    try {
        const user = await getUserByUUID(ban.uuid);
        ban.uuid_nickname = user.NICKNAME;
    } catch (e) {
        // Если пользователь не найден, оставляем nickname пустым
        ban.uuid_nickname = undefined;
    }
    return ban;
}

/**
 * Преобразовать BanEntry в публичный формат (без персональных данных)
 * Удаляет IP, banned_by_uuid и другую персональную информацию
 */
function toPublicBan(ban: BanEntry): BanEntryPublic {
    return {
        id: ban.id,
        uuid: ban.uuid,
        uuid_nickname: ban.uuid_nickname,
        reason: ban.reason,
        banned_by_name: ban.banned_by_name,
        removed_by_name: ban.removed_by_name,
        removed_by_reason: ban.removed_by_reason,
        removed_by_date: ban.removed_by_date,
        time: ban.time,
        until: ban.until,
        template: ban.template,
        server_scope: ban.server_scope,
        silent: ban.silent,
        ipban: ban.ipban,
        active: ban.active
    };
}

/**
 * Получить активный бан пользователя по UUID или IP.
 * Проверяет флаг `active = 1` и срок действия `until`.
 */
export async function checkActiveBan(uuid: string, ip?: string): Promise<BanEntry | null> {
    const pool = useMySQL(CONNECTION_NAME);
    const now = Date.now();
    const cleanUuid = normalizeUuid(uuid);

    // Логика:
    // 1. Ищем по UUID или IP
    // 2. Бан должен быть active = 1
    // 3. Время 'until' должно быть больше текущего (или <= 0, если это перманентный бан)

    let sql = `
        SELECT * FROM \`litebans_bans\` 
        WHERE (\`uuid\` = ? ${ip ? 'OR `ip` = ?' : ''})
        AND \`active\` = 1 
        AND (\`until\` > ? OR \`until\` <= 0)
        ORDER BY \`id\` DESC 
        LIMIT 1
    `;

    const params: any[] = [cleanUuid];
    if (ip) params.push(ip);
    params.push(now);

    try {
        const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
        let ban = (rows[0] as BanEntry) || null;

        // Добавляем никнейм, если бан найден
        if (ban) {
            ban = await enrichBanWithNickname(ban);
        }

        return ban;
    } catch (e: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Database error checking ban',
            data: { statusMessageRu: 'Ошибка проверки бана', error: e.message }
        });
    }
}

/**
 * Проверить, забанен ли пользователь (по UUID).
 * Возвращает true, если есть активный бан.
 */
export async function isUserBanned(uuid: string): Promise<boolean> {
    const ban = await checkActiveBan(uuid);
    return !!ban;
}



/**
 * Создать новый бан
 */
export async function createBan(dto: CreateBanDto): Promise<BanEntry> {
    const pool = useMySQL(CONNECTION_NAME);

    const now = Date.now();
    const until = dto.durationMs <= 0 ? 0 : (now + dto.durationMs);

    // Удаление скина, если бан дольше чем на 30 дней (30 * 24 * 60 * 60 * 1000 = 2592000000 ms)
    // Или если перманентный (<= 0)
    if (dto.durationMs > 2592000000 || dto.durationMs <= 0) {
        deleteSkin(dto.targetUuid).catch(err => {
            console.error(`[BanUtils] Failed to delete skin for banned user ${dto.targetUuid}:`, err);
        });
    }

    const cleanTargetUuid = dto.targetUuid;
    const cleanAdminUuid = dto.adminUuid;

    const sql = `
        INSERT INTO \`litebans_bans\` (
            \`uuid\`, \`ip\`, \`reason\`, 
            \`banned_by_uuid\`, \`banned_by_name\`, 
            \`time\`, \`until\`, 
            \`active\`, \`ipban\`, \`silent\`,
            \`server_scope\`, \`server_origin\`, \`ipban_wildcard\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, '*', NULL, 0)
    `;

    const params = [
        cleanTargetUuid,
        dto.targetIp || null,
        dto.reason,
        cleanAdminUuid,
        dto.adminName,
        now,
        until,
        1,
        dto.silent ? 1 : 0
    ];

    try {
        const [result] = await pool.execute<ResultSetHeader>(sql, params);

        // Получаем созданный бан со всеми данными
        const banId = result.insertId;
        const ban = await getBanById(banId);

        return ban;
    } catch (e: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to ban user',
            data: { statusMessageRu: 'Не удалось выдать бан', error: e.message }
        });
    }
}

/**
 * Снять бан (Pardon)
 * Устанавливает active = 0 и заполняет поля removed_by...
 */
export async function removeBan(banId: number, adminUuid: string = "[Web]", adminName: string = "[Web]", reason: string = "Unbanned via Web") {
    const pool = useMySQL(CONNECTION_NAME);
    const cleanAdminUuid = adminUuid;

    const dateObj = new Date();
    const dateStr = dateObj.toISOString().slice(0, 19).replace('T', ' ');

    const sql = `
        UPDATE \`litebans_bans\` SET 
            \`active\` = 0,
            \`removed_by_uuid\` = ?,
            \`removed_by_name\` = ?,
            \`removed_by_reason\` = ?,
            \`removed_by_date\` = ?
        WHERE \`id\` = ? AND \`active\` = 1
    `;

    try {
        const [result] = await pool.execute<ResultSetHeader>(sql, [
            cleanAdminUuid,
            adminName,
            reason,
            dateStr,
            banId
        ]);

        if (result.affectedRows === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Ban not found or already inactive',
                data: { statusMessageRu: 'Бан не найден или уже снят' }
            });
        }
    } catch (e: any) {
        // Если это наша ошибка 404, прокидываем дальше, иначе 500
        if (e.statusCode) throw e;

        throw createError({
            statusCode: 500,
            statusMessage: 'Database error removing ban',
            data: { statusMessageRu: 'Ошибка при снятии бана', error: e.message }
        });
    }
}

/**
 * Получить бан по ID
 */
export async function getBanById(id: number): Promise<BanEntry> {
    const pool = useMySQL(CONNECTION_NAME);

    const sql = 'SELECT * FROM `litebans_bans` WHERE `id` = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [id]);
    let ban = rows[0] as BanEntry | undefined;

    if (!ban) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Ban not found',
            data: { statusMessageRu: 'Бан не найден' }
        });
    }

    // Добавляем никнейм забаненного пользователя
    ban = await enrichBanWithNickname(ban);

    return ban;
}

export async function searchBans(
    limit: number = 10,
    offset: number = 0,
    onlyActive: boolean = false,
    searchQuery?: string
): Promise<{ items: BanEntryPublic[], total: number }> {
    const pool = useMySQL(CONNECTION_NAME);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (onlyActive) {
        whereClause += ' AND `active` = 1';
    }

    if (searchQuery) {
        whereClause += ' AND (`uuid` LIKE ? OR `banned_by_name` LIKE ? OR `reason` LIKE ?)';
        const like = `%${searchQuery}%`;
        params.push(like, like, like);
    }

    // Получаем общее количество для пагинации
    const countSql = `SELECT COUNT(*) as total FROM \`litebans_bans\` ${whereClause}`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countSql, params);
    const total = countRows[0].total;

    // Получаем данные
    const sql = `SELECT * FROM \`litebans_bans\`  ${whereClause} ORDER BY \`id\` DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

    let items = rows as BanEntry[];

    // Добавляем никнейм для каждого забаненного пользователя
    items = await Promise.all(items.map(ban => enrichBanWithNickname(ban)));

    // Преобразуем в публичный формат
    const publicItems = items.map(toPublicBan);

    return {
        items: publicItems,
        total
    };
}

/**
 * Получить всех пользователей, забаненных более чем на минимальную длительность
 * Используется для администраторских операций (удаление скинов и т.д.)
 */
export async function getBannedUsersWithMinDuration(minDurationMs: number): Promise<BanEntry[]> {
    const pool = useMySQL(CONNECTION_NAME);
    const now = Date.now();

    // Логика: для каждого активного бана проверяем длительность
    // Если until = -1 (навсегда), то длительность бесконечна
    // Иначе length = until - time

    const sql = `
        SELECT * FROM \`litebans_bans\`
        WHERE \`active\` = 1 AND (
            \`until\` <= 0 OR 
            (\`until\` - \`time\`) >= ?
        )
        ORDER BY \`id\` DESC
    `;

    try {
        const [rows] = await pool.execute<RowDataPacket[]>(sql, [minDurationMs]);
        let bans = rows as BanEntry[];

        // Добавляем nicknames для каждого
        bans = await Promise.all(bans.map(ban => enrichBanWithNickname(ban)));

        return bans;
    } catch (e: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Database error getting banned users',
            data: { statusMessageRu: 'Ошибка при получении забаненных пользователей', error: e.message }
        });
    }
}

/**
 * Удалить скины для всех пользователей, забаненных более чем на X мс
 * Возвращает количество удаленных скинов и список пользователей
 */
export async function deleteSkinsBatchForBannedUsers(minDurationMs: number): Promise<{
    deleted: number;
    skipped: number;
    users: Array<{ uuid: string; uuid_nickname?: string; reason: string }>;
    errors: Array<{ uuid: string; error: string }>;
}> {
    const bans = await getBannedUsersWithMinDuration(minDurationMs);

    let deleted = 0;
    let skipped = 0;
    const errors: Array<{ uuid: string; error: string }> = [];
    const users = bans.map(ban => ({
        uuid: ban.uuid,
        uuid_nickname: ban.uuid_nickname,
        reason: ban.reason
    }));

    // Параллельно удаляем скины
    await Promise.all(
        bans.map(async (ban) => {
            try {
                const wasDeleted = await deleteSkin(ban.uuid);
                if (wasDeleted) {
                    deleted++;
                } else {
                    skipped++; // Скин не найден (уже удалён или не был загружен)
                }
            } catch (e: any) {
                errors.push({
                    uuid: ban.uuid,
                    error: e.message || 'Unknown error'
                });
            }
        })
    );

    return {
        deleted,
        skipped,
        users,
        errors
    };
}

