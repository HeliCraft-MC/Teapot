import { v4 as uuidv4 } from 'uuid'
import { IStateWarrant, IStateOrder, RolesInState } from '~/interfaces/state/state.types'
import { isRoleHigherOrEqual } from '~/utils/states/citizenship.utils'

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
    const stmt = db().prepare(`
        INSERT INTO state_warrants (
            uuid, created, updated,
            state_uuid, affected_player_uuid,
            reason, issued_by_player_uuid,
            actions_taken_by_admins,
            actions_by_admins_details,
            actions_taken_by_state,
            actions_by_state_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL)
    `)
    const res = await stmt.run(
        uuid,
        now,
        now,
        stateUuid,
        affectedPlayerUuid,
        reason,
        issuedByPlayerUuid
    )
    if (!res.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create warrant',
            data: { statusMessageRu: 'Не удалось создать ордер' }
        })
    }
    return uuid
}

export async function getWarrant(uuid: string): Promise<IStateWarrant> {
    const row = await db().prepare('SELECT * FROM state_warrants WHERE uuid = ?').get(uuid) as IStateWarrant | undefined
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
    const rows = await db().prepare(
        'SELECT * FROM state_warrants WHERE state_uuid = ? ORDER BY created DESC LIMIT ? OFFSET ?'
    ).all(stateUuid, limit, startAt) as IStateWarrant[]
    return rows
}

export async function updateWarrant(uuid: string, patch: Partial<IStateWarrant>, updaterUuid: string): Promise<void> {
    const warrant = await getWarrant(uuid)
    if (!await isRoleHigherOrEqual(warrant.state_uuid, updaterUuid, RolesInState.OFFICER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для изменения ордера' }
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
    const sql = `UPDATE state_warrants SET ${cols.join(', ')} WHERE uuid = ?`
    const res = await db().prepare(sql).run(...params)
    if (!res.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update warrant',
            data: { statusMessageRu: 'Не удалось обновить ордер' }
        })
    }
}

export async function deleteWarrant(uuid: string, requesterUuid: string): Promise<void> {
    const warrant = await getWarrant(uuid)
    if (!await isRoleHigherOrEqual(warrant.state_uuid, requesterUuid, RolesInState.OFFICER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для удаления ордера' }
        })
    }
    const res = await db().prepare('DELETE FROM state_warrants WHERE uuid = ?').run(uuid)
    if (!res.success) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to delete warrant' })
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
    const uuid = uuidv4()
    const now = Date.now()
    const stmt = db().prepare(`
        INSERT INTO state_orders (
            uuid, created, updated,
            state_uuid, title, text,
            published_at, issued_by_player_uuid,
            importance, is_active, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `)
    const res = await stmt.run(
        uuid,
        now,
        now,
        stateUuid,
        title,
        text,
        now,
        issuedByPlayerUuid,
        importance,
        expiresAt
    )
    if (!res.success) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to create order', data: { statusMessageRu: 'Не удалось создать указ' } })
    }
    return uuid
}

export async function getOrder(uuid: string): Promise<IStateOrder> {
    const row = await db().prepare('SELECT * FROM state_orders WHERE uuid = ?').get(uuid) as IStateOrder | undefined
    if (!row) {
        throw createError({ statusCode: 404, statusMessage: 'Order not found', data: { statusMessageRu: 'Указ не найден' } })
    }
    return row
}

export async function listOrdersByState(stateUuid: string, startAt = 0, limit = 100): Promise<IStateOrder[]> {
    const rows = await db().prepare(
        'SELECT * FROM state_orders WHERE state_uuid = ? ORDER BY published_at DESC LIMIT ? OFFSET ?'
    ).all(stateUuid, limit, startAt) as IStateOrder[]
    return rows
}

export async function updateOrder(uuid: string, patch: Partial<IStateOrder>, updaterUuid: string): Promise<void> {
    const order = await getOrder(uuid)
    if (!await isRoleHigherOrEqual(order.state_uuid, updaterUuid, RolesInState.MINISTER)) {
        throw createError({ statusCode: 403, statusMessage: 'Not authorized', data: { statusMessageRu: 'Недостаточно прав для изменения указа' } })
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
    const sql = `UPDATE state_orders SET ${cols.join(', ')} WHERE uuid = ?`
    const res = await db().prepare(sql).run(...params)
    if (!res.success) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to update order' })
    }
}

export async function deleteOrder(uuid: string, requesterUuid: string): Promise<void> {
    const order = await getOrder(uuid)
    if (!await isRoleHigherOrEqual(order.state_uuid, requesterUuid, RolesInState.MINISTER)) {
        throw createError({ statusCode: 403, statusMessage: 'Not authorized', data: { statusMessageRu: 'Недостаточно прав для удаления указа' } })
    }
    const res = await db().prepare('DELETE FROM state_orders WHERE uuid = ?').run(uuid)
    if (!res.success) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to delete order' })
    }
}
