import { useMySQL } from "~/plugins/mySql"; // Путь к твоему плагину
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { BanEntry, CreateBanDto } from "~/interfaces/banlist.types";
import { deleteSkin } from "./skin.utils";

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
        SELECT * FROM \`bans\` 
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
        return (rows[0] as BanEntry) || null;
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
export async function createBan(dto: CreateBanDto): Promise<number> {
    const pool = useMySQL(CONNECTION_NAME);

    const now = Date.now();
    const until = dto.durationMs <= 0 ? -1 : (now + dto.durationMs);

    // Удаление скина, если бан дольше чем на 30 дней (30 * 24 * 60 * 60 * 1000 = 2592000000 ms)
    // Или если перманентный (<= 0)
    if (dto.durationMs > 2592000000 || dto.durationMs <= 0) {
        deleteSkin(dto.targetUuid).catch(err => {
            console.error(`[BanUtils] Failed to delete skin for banned user ${dto.targetUuid}:`, err);
        });
    }

    const cleanTargetUuid = normalizeUuid(dto.targetUuid);
    const cleanAdminUuid = normalizeUuid(dto.adminUuid);

    const sql = `
        INSERT INTO \`bans\` (
            \`uuid\`, \`ip\`, \`reason\`, 
            \`banned_by_uuid\`, \`banned_by_name\`, 
            \`time\`, \`until\`, 
            \`active\`, \`ipban\`, \`silent\`,
            \`server_scope\`, \`server_origin\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, '*', NULL)
    `;

    const params = [
        cleanTargetUuid,
        dto.targetIp || null,
        dto.reason,
        cleanAdminUuid,
        dto.adminName,
        now,
        until,
        dto.isIpBan ? 1 : 0,
        dto.silent ? 1 : 0
    ];

    try {
        const [result] = await pool.execute<ResultSetHeader>(sql, params);
        return result.insertId;
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
    const cleanAdminUuid = normalizeUuid(adminUuid);

    const dateObj = new Date();
    const dateStr = dateObj.toISOString().slice(0, 19).replace('T', ' ');

    const sql = `
        UPDATE \`bans\` SET 
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

    const sql = 'SELECT * FROM `bans` WHERE `id` = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [id]);
    const ban = rows[0] as BanEntry | undefined;

    if (!ban) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Ban not found',
            data: { statusMessageRu: 'Бан не найден' }
        });
    }

    return ban;
}

export async function searchBans(
    limit: number = 10,
    offset: number = 0,
    onlyActive: boolean = false,
    searchQuery?: string
): Promise<{ items: BanEntry[], total: number }> {
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
    const countSql = `SELECT COUNT(*) as total FROM \`bans\` ${whereClause}`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countSql, params);
    const total = countRows[0].total;

    // Получаем данные
    const sql = `SELECT * FROM \`bans\` ${whereClause} ORDER BY \`id\` DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

    return {
        items: rows as BanEntry[],
        total
    };
}