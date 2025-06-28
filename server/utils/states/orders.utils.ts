import { v4 as uuidv4 } from 'uuid'
import { IStateWarrant, IStateOrder, RolesInState } from '~/interfaces/state/state.types'
import { isRoleHigherOrEqual } from '~/utils/states/citizenship.utils'
import {ResultSetHeader, RowDataPacket} from "mysql2";
import {useMySQL} from "~/plugins/mySql";

const db = () => useDatabase('states')

/* -------------------- Warrants -------------------- */

export async function createWarrant(
    stateUuid: string,
    affectedPlayerUuid: string,
    reason: string,
    issuedByPlayerUuid: string
): Promise<string> {
    if (!await isRoleHigherOrEqual(stateUuid, issuedByPlayerUuid, RolesInState.OFFICER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для выдачи ордера' }
        })
    }

    const uuid = uuidv4()
    const now = Date.now()
    const pool = useMySQL('states')

    // DEPRECATED:
    // const stmt = db().prepare(`...`).run(...)
    const sql = `
        INSERT INTO state_warrants (
            uuid, created, updated,
            state_uuid, affected_player_uuid,
            reason, issued_by_player_uuid,
            actions_taken_by_admins,
            actions_by_admins_details,
            actions_taken_by_state,
            actions_by_state_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL)
    `
    const values = [
        uuid, now, now,
        stateUuid, affectedPlayerUuid,
        reason, issuedByPlayerUuid
    ]
    const [result] = await pool.execute<ResultSetHeader>(sql, values)

    if (result.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create warrant',
            data: { statusMessageRu: 'Не удалось создать ордер' }
        })
    }

    return uuid
}

export async function getWarrant(uuid: string): Promise<IStateWarrant> {
    const pool = useMySQL('states')

    // DEPRECATED:
    // const row = await db().prepare('SELECT ...').get(uuid)
    const sql = 'SELECT * FROM state_warrants WHERE uuid = ?'
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [uuid])
    const row = rows[0] as IStateWarrant | undefined

    if (!row) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Warrant not found',
            data: { statusMessageRu: 'Ордер не найден' }
        })
    }

    return row
}

export async function listWarrantsByState(stateUuid: string, startAt = 0, limit = 100): Promise<IStateWarrant[]> {
    const pool = useMySQL('states')

    // DEPRECATED:
    // const rows = await db().prepare('SELECT ...').all(...)
    const sql = `
        SELECT * FROM state_warrants
        WHERE state_uuid = ?
        ORDER BY created DESC
        LIMIT ? OFFSET ?
    `
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [stateUuid, limit, startAt])
    return rows as IStateWarrant[]
}

export async function updateWarrant(uuid: string, patch: Partial<IStateWarrant>, updaterUuid: string): Promise<void> {
    const pool = useMySQL('states')
    const warrant = await getWarrant(uuid)

    if (!await isRoleHigherOrEqual(warrant.state_uuid, updaterUuid, RolesInState.OFFICER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для изменения ордера' }
        })
    }

    const allowedColumns = [
        'reason', 'actions_taken_by_admins', 'actions_by_admins_details',
        'actions_taken_by_state', 'actions_by_state_details'
    ]
    const cols: string[] = []
    const params: any[] = []

    for (const [key, val] of Object.entries(patch)) {
        if (val === undefined || !allowedColumns.includes(key)) continue
        cols.push(`${key} = ?`)
        params.push(val)
    }

    if (!cols.length) return

    cols.push('updated = ?')
    params.push(Date.now())
    params.push(uuid)

    // DEPRECATED:
    // const res = await db().prepare(sql).run(...params)
    const sql = `UPDATE state_warrants SET ${cols.join(', ')} WHERE uuid = ?`
    const [res] = await pool.execute<ResultSetHeader>(sql, params)

    if (res.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update warrant',
            data: { statusMessageRu: 'Не удалось обновить ордер' }
        })
    }
}

export async function deleteWarrant(uuid: string, requesterUuid: string): Promise<void> {
    const pool = useMySQL('states')
    const warrant = await getWarrant(uuid)

    if (!await isRoleHigherOrEqual(warrant.state_uuid, requesterUuid, RolesInState.OFFICER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для удаления ордера' }
        })
    }

    // DEPRECATED:
    // const res = await db().prepare('DELETE ...').run(uuid)
    const sql = 'DELETE FROM state_warrants WHERE uuid = ?'
    const [res] = await pool.execute<ResultSetHeader>(sql, [uuid])

    if (res.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete warrant',
            data: { statusMessageRu: 'Не удалось удалить ордер' }
        })
    }
}


/* -------------------- Orders -------------------- */

export async function createOrder(
    stateUuid: string,
    title: string,
    text: string,
    issuedByPlayerUuid: string,
    importance: 'pinned' | 'high' | 'medium' | 'low' = 'low',
    expiresAt: number | null = null
): Promise<string> {
    if (!await isRoleHigherOrEqual(stateUuid, issuedByPlayerUuid, RolesInState.MINISTER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для издания указа' }
        })
    }

    const pool = useMySQL('states')
    const uuid = uuidv4()
    const now = Date.now()

    // DEPRECATED:
    // const stmt = db().prepare(`INSERT INTO state_orders (...) VALUES (...)`)
    // const res = await stmt.run(...)
    const sql = `
        INSERT INTO state_orders (
            uuid, created, updated,
            state_uuid, title, text,
            published_at, issued_by_player_uuid,
            importance, is_active, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `
    const values = [
        uuid, now, now,
        stateUuid, title, text,
        now, issuedByPlayerUuid,
        importance,
        expiresAt
    ]
    const [res] = await pool.execute<ResultSetHeader>(sql, values)

    if (res.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create order',
            data: { statusMessageRu: 'Не удалось создать указ' }
        })
    }

    return uuid
}

export async function getOrder(uuid: string): Promise<IStateOrder> {
    const pool = useMySQL('states')

    // DEPRECATED:
    // const row = await db().prepare('SELECT * FROM state_orders WHERE uuid = ?').get(uuid)
    const sql = 'SELECT * FROM state_orders WHERE uuid = ?'
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [uuid])
    const row = rows[0] as IStateOrder | undefined

    if (!row) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Order not found',
            data: { statusMessageRu: 'Указ не найден' }
        })
    }

    return row
}

export async function listOrdersByState(stateUuid: string, startAt = 0, limit = 100): Promise<IStateOrder[]> {
    const pool = useMySQL('states')

    // DEPRECATED:
    // const rows = await db().prepare('SELECT * FROM state_orders WHERE ...').all(...)
    const sql = `
        SELECT * FROM state_orders
        WHERE state_uuid = ?
        ORDER BY published_at DESC
        LIMIT ? OFFSET ?
    `
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [stateUuid, limit, startAt])
    return rows as IStateOrder[]
}

export async function updateOrder(uuid: string, patch: Partial<IStateOrder>, updaterUuid: string): Promise<void> {
    const pool = useMySQL('states')
    const order = await getOrder(uuid)

    if (!await isRoleHigherOrEqual(order.state_uuid, updaterUuid, RolesInState.MINISTER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для изменения указа' }
        })
    }

    const cols: string[] = []
    const params: any[] = []

    for (const [key, val] of Object.entries(patch)) {
        if (val === undefined) continue
        cols.push(`${key} = ?`)
        params.push(val)
    }

    if (!cols.length) return

    cols.push('updated = ?')
    params.push(Date.now())
    params.push(uuid)

    // DEPRECATED:
    // const res = await db().prepare(sql).run(...params)
    const sql = `UPDATE state_orders SET ${cols.join(', ')} WHERE uuid = ?`
    const [res] = await pool.execute<ResultSetHeader>(sql, params)

    if (res.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update order'
        })
    }
}

export async function deleteOrder(uuid: string, requesterUuid: string): Promise<void> {
    const pool = useMySQL('states')
    const order = await getOrder(uuid)

    if (!await isRoleHigherOrEqual(order.state_uuid, requesterUuid, RolesInState.MINISTER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для удаления указа' }
        })
    }

    // DEPRECATED:
    // const res = await db().prepare('DELETE FROM state_orders WHERE uuid = ?').run(uuid)
    const sql = 'DELETE FROM state_orders WHERE uuid = ?'
    const [res] = await pool.execute<ResultSetHeader>(sql, [uuid])

    if (res.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete order'
        })
    }
}

