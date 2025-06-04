import { v4 as uuidv4 } from 'uuid'
import {
    HistoryEventType,
    IHistoryEvent
} from '~/interfaces/state/history.types'

/* ──────────── вспомогательные типы ──────────── */

type ArrOrOne<T> = T | T[]

/**
 * Набор фильтров для listHistoryEvents()
 */
export interface HistoryFilters {
    type?: ArrOrOne<HistoryEventType>
    stateUuid?: ArrOrOne<string>
    playerUuid?: ArrOrOne<string>
    allianceUuid?: ArrOrOne<string>
    warUuid?: string
    cityUuid?: ArrOrOne<string>
    createdByUuid?: string
    /** created >= after  */
    after?: number
    /** created <= before */
    before?: number
    /** Поиск по title / description (LIKE %q%) */
    search?: string
    /** Сезон */
    season?: number | null
    /** Показывать soft-deleted записи */
    includeDeleted?: boolean
}

/**
 * Поля, которые разрешено передавать в addHistoryEvent()
 */
export type HistoryInsert = Omit<
    IHistoryEvent,
    | 'uuid'
    | 'created'
    | 'updated'
    | 'is_deleted'
    | 'deleted_at'
    | 'deleted_by_uuid'
>;


/**
 * Поля, которые разрешено изменять через updateHistoryEvent().
 */
export type HistoryUpdate = Partial<
    Pick<
        IHistoryEvent,
        | 'title'
        | 'description'
        | 'state_uuids'
        | 'player_uuids'
        | 'alliance_uuids'
        | 'war_uuid'
        | 'city_uuids'
        | 'details_json'
    >
>

/* ──────────── кэш SQL ──────────── */

const db = useDatabase('states')

/** Подготовленные выражения, переиспользуются для скорости */
const stmtCache = {
    insert: db.prepare(`
        INSERT INTO history_events (
            uuid, created, updated,
            type, title, description, season,
            state_uuids, player_uuids, alliance_uuids,
            war_uuid, city_uuids, details_json,
            created_by_uuid, is_deleted
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `),
    selectByUuid: db.prepare('SELECT * FROM history_events WHERE uuid = ?'),
    markDeleted: db.prepare(`
    UPDATE history_events
    SET is_deleted = 1, updated = ?, deleted_at = ?, deleted_by_uuid = ?
    WHERE uuid = ? AND is_deleted = 0
  `),
    countBase: db.prepare('SELECT COUNT(*) as count FROM history_events'),
}

/* ──────────── утилиты ──────────── */

/**
 * Безопасный LIKE — экранирует % и _
 */
function likeEscape(raw: string) {
    return raw.replace(/([%_])/g, '\\$1')
}

/**
 * Приводит строковое/массивное значение к массиву
 */
function toArray<T>(val?: ArrOrOne<T>): T[] | undefined {
    if (val === undefined) return undefined
    return Array.isArray(val) ? val : [val]
}

/**
 * Маппинг SQL-строки → IHistoryEvent
 */
function mapRow(row: any): IHistoryEvent {
    return {
        uuid: row.uuid,
        created: row.created,
        updated: row.updated,
        type: row.type as HistoryEventType,
        title: row.title,
        description: row.description,
        state_uuids: row.state_uuids ? JSON.parse(row.state_uuids) : null,
        player_uuids: row.player_uuids ? JSON.parse(row.player_uuids) : null,
        alliance_uuids: row.alliance_uuids ? JSON.parse(row.alliance_uuids) : null,
        war_uuid: row.war_uuid,
        city_uuids: row.city_uuids ? JSON.parse(row.city_uuids) : null,
        details_json: row.details_json ? JSON.parse(row.details_json) : null,
        created_by_uuid: row.created_by_uuid,
        // расширенные поля soft-delete
        is_deleted: !!row.is_deleted,
        deleted_at: row.deleted_at ?? null,
        deleted_by_uuid: row.deleted_by_uuid ?? null,
        season: row.season ?? null,
    } as IHistoryEvent
}

/* ──────────── создание ──────────── */

/**
 * Добавляет запись в историю.
 *
 * validateCb — опциональный коллбэк, который сможет проверить
 * существование переданных UUID (государства, игроки и т.д.)
 * и вернуть true/false или бросить ошибку.
 */
export async function addHistoryEvent(
    data: HistoryInsert,
    validateCb?: (payload: HistoryInsert) => Promise<void> | void
): Promise<string> {
    if (validateCb) await validateCb(data);

    const now  = Date.now();
    const uuid = uuidv4();

    await stmtCache.insert.run(
        uuid,
        now,
        now,
        data.type,
        data.title,
        data.description,
        data.season ?? null,
        data.state_uuids   ? JSON.stringify(data.state_uuids)   : null,
        data.player_uuids  ? JSON.stringify(data.player_uuids)  : null,
        data.alliance_uuids? JSON.stringify(data.alliance_uuids): null,
        data.war_uuid      ?? null,
        data.city_uuids    ? JSON.stringify(data.city_uuids)    : null,
        data.details_json  ? JSON.stringify(data.details_json)  : null,
        data.created_by_uuid
    );

    return uuid;
}


/* ──────────── чтение ──────────── */

export async function getHistoryEvent(uuid: string): Promise<IHistoryEvent> {
    const row = stmtCache.selectByUuid.get(uuid) as any
    if (!row || row.is_deleted) {
        throw createError({
            statusCode: 404,
            statusMessage: 'History event not found',
            data: { statusMessageRu: 'Событие не найдено' },
        })
    }
    return mapRow(row)
}

/**
 * Построение WHERE по фильтрам
 */
function buildWhere(filters: HistoryFilters): { where: string; params: any[] } {
    const parts: string[] = []
    const params: any[] = []

    // soft-delete
    if (!filters.includeDeleted) {
        parts.push('is_deleted = 0')
    }

    // тип
    if (filters.type) {
        const arr = toArray(filters.type)!
        parts.push(`type IN (${arr.map(() => '?').join(',')})`)
        params.push(...arr)
    }

    // JSON-поля
    const jsonFilters: Array<[string, string[] | undefined]> = [
        ['state_uuids', toArray(filters.stateUuid)],
        ['player_uuids', toArray(filters.playerUuid)],
        ['alliance_uuids', toArray(filters.allianceUuid)],
        ['city_uuids', toArray(filters.cityUuid)],
    ]

    for (const [field, arr] of jsonFilters) {
        if (arr && arr.length) {
            parts.push(`JSON_OVERLAPS(${field}, ?)`)
            params.push(JSON.stringify(arr))
        }
    }

    // war
    if (filters.warUuid) {
        parts.push('war_uuid = ?')
        params.push(filters.warUuid)
    }

    // author
    if (filters.createdByUuid) {
        parts.push('created_by_uuid = ?')
        params.push(filters.createdByUuid)
    }

    // даты
    if (filters.after) {
        parts.push('created >= ?')
        params.push(filters.after)
    }
    if (filters.before) {
        parts.push('created <= ?')
        params.push(filters.before)
    }

    // LIKE-поиск
    if (filters.search) {
        const q = `%${likeEscape(filters.search)}%`
        parts.push('(title LIKE ? ESCAPE \'\\\' OR description LIKE ? ESCAPE \'\\\')')
        params.push(q, q)
    }

    const where = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
    return { where, params }
}

/**
 * Универсальная выборка истории.
 */
export async function listHistoryEvents(
    filters: HistoryFilters = {},
    startAt = 0,
    limit = 100,
    order: 'asc' | 'desc' = 'desc'
): Promise<IHistoryEvent[]> {
    const { where, params } = buildWhere(filters)

    const sql = `
    SELECT * FROM history_events
    ${where}
    ORDER BY created ${order.toUpperCase()}
    LIMIT ? OFFSET ?
  `
    const rows = await db.prepare(sql).all(...params, limit, startAt) as any[]
    return rows.map(mapRow)
}

/**
 * Считает количество записей c тем же набором фильтров.
 */
export async function countHistoryEvents(
    filters: HistoryFilters = {}
): Promise<number> {
    const { where, params } = buildWhere(filters)
    const row = await db
        .prepare(`SELECT COUNT(*) as count FROM history_events ${where}`)
        .get(...params) as { count: number }
    return row.count
}

/* ──────────── короткие алиасы (state / player / alliance …) ──────────── */

export const getHistoryByState = (
    stateUuid: string,
    startAt = 0,
    limit = 100
) =>
    listHistoryEvents({ stateUuid }, startAt, limit)

export const getHistoryByPlayer = (
    playerUuid: string,
    startAt = 0,
    limit = 100
) =>
    listHistoryEvents({ playerUuid }, startAt, limit)

export const getHistoryByAlliance = (
    allianceUuid: string,
    startAt = 0,
    limit = 100
) =>
    listHistoryEvents({ allianceUuid }, startAt, limit)

export const getHistoryByWar = (
    warUuid: string,
    startAt = 0,
    limit = 100
) => listHistoryEvents({ warUuid }, startAt, limit)

/* ──────────── обновление и soft-delete ──────────── */

export async function updateHistoryEvent(
    uuid: string,
    patch: HistoryUpdate,
    updaterUuid: string
) {
    if (!Object.keys(patch).length) return

    // формируем SET-часть динамически
    const cols: string[] = []
    const params: any[] = []
    const now = Date.now()

    for (const [key, val] of Object.entries(patch)) {
        if (val === undefined) continue

        if (
            [
                'state_uuids',
                'player_uuids',
                'alliance_uuids',
                'city_uuids',
                'details_json',
            ].includes(key)
        ) {
            cols.push(`${key} = ?`)
            params.push(val ? JSON.stringify(val) : null)
        } else {
            cols.push(`${key} = ?`)
            params.push(val)
        }
    }

    cols.push('updated = ?')
    params.push(now)

    const sql = `UPDATE history_events SET ${cols.join(', ')} WHERE uuid = ? AND is_deleted = 0`
    const res = db.prepare(sql).run(...params, uuid)

}

/**
 * Мягкое удаление записи (скрыть из публичной ленты).
 */
export async function softDeleteHistoryEvent(
    uuid: string,
    deletedByUuid: string
) {
    const now = Date.now()
    const res = stmtCache.markDeleted.run(now, now, deletedByUuid, uuid)

}
