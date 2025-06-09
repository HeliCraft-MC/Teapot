import { v4 as uuidv4 } from 'uuid'
import {
    BattleStatus,
    BattleType,
    IWar,
    IWarBattle,
    WarSideRole,
    WarStatus
} from '~/interfaces/state/diplomacy.types'
import { RolesInState } from '../../../../HeliCraftFrontNuxtVesper/types/state.types'
import { IHistoryEvent, HistoryEventType } from '~/interfaces/state/history.types'
import { getStateByUuid } from '~/utils/states/state.utils'
import { addHistoryEvent } from '~/utils/states/history.utils'
import { isRoleHigherOrEqual } from '~/utils/states/citizenship.utils'
import {
    listAlliancesForState,
    listAllianceMembers,
} from '~/utils/states/diplomacy.utils'
import { isUserAdmin } from '~/utils/user.utils'

const db = () => useDatabase('states')

export async function declareWar(
    attackerStateUuid: string,
    defenderStateUuid: string,
    attackerPlayerUuid: string,
    name: string,
    reason: string,
    victoryCondition: string
): Promise<string> {
    await getStateByUuid(attackerStateUuid)
    await getStateByUuid(defenderStateUuid)

    if (!await isRoleHigherOrEqual(attackerStateUuid, attackerPlayerUuid, RolesInState.DIPLOMAT)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для объявления войны' }
        })
    }

    const now = Date.now()
    const warUuid = uuidv4()

    const warStmt = db().prepare(`
        INSERT INTO wars (
            uuid, created, updated,
            name, reason, victory_condition,
            status, result, result_action
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)
    `)
    const warRes = await warStmt.run(
        warUuid,
        now,
        now,
        name,
        reason,
        victoryCondition,
        WarStatus.PROPOSED
    )
    if (!warRes.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to declare war',
            data: { statusMessageRu: 'Не удалось объявить войну' }
        })
    }

    const partStmt = db().prepare(`
        INSERT INTO war_participants (
            uuid, created, updated,
            war_uuid, state_uuid, side_role
        ) VALUES (?, ?, ?, ?, ?, ?)
    `)
    const participantSet = new Set<string>()
    await partStmt.run(uuidv4(), now, now, warUuid, attackerStateUuid, WarSideRole.ATTACKER)
    participantSet.add(attackerStateUuid)
    await partStmt.run(uuidv4(), now, now, warUuid, defenderStateUuid, WarSideRole.DEFENDER)
    participantSet.add(defenderStateUuid)

    const attackerAlliances = await listAlliancesForState(attackerStateUuid)
    const defenderAlliances = await listAlliancesForState(defenderStateUuid)

    const allianceUuids: string[] = []

    for (const alliance of attackerAlliances) {
        allianceUuids.push(alliance.uuid)
        const members = await listAllianceMembers(alliance.uuid)
        for (const member of members) {
            if (participantSet.has(member.state_uuid)) continue
            participantSet.add(member.state_uuid)
            await partStmt.run(uuidv4(), now, now, warUuid, member.state_uuid, WarSideRole.ALLY_ATTACKER)
        }
    }

    for (const alliance of defenderAlliances) {
        allianceUuids.push(alliance.uuid)
        const members = await listAllianceMembers(alliance.uuid)
        for (const member of members) {
            if (participantSet.has(member.state_uuid)) continue
            participantSet.add(member.state_uuid)
            await partStmt.run(uuidv4(), now, now, warUuid, member.state_uuid, WarSideRole.ALLY_DEFENDER)
        }
    }

    const hist: IHistoryEvent = {
        uuid: uuidv4(),
        created: now,
        updated: now,
        type: HistoryEventType.WAR_DECLARED,
        title: 'Объявлена война',
        description: reason,
        state_uuids: Array.from(participantSet),
        alliance_uuids: allianceUuids.length ? allianceUuids : null,
        player_uuids: [attackerPlayerUuid],
        war_uuid: warUuid,
        city_uuids: null,
        details_json: JSON.stringify({ victoryCondition }),
        created_by_uuid: attackerPlayerUuid,

        season: null,
        is_deleted: false,
        deleted_at: null,
        deleted_by_uuid: null,
    }
    await addHistoryEvent(hist)

    return warUuid
}

export async function respondWarDeclaration(
    warUuid: string,
    defenderStateUuid: string,
    defenderPlayerUuid: string,
    accept: boolean
): Promise<void> {
    const war = await getWarByUuid(warUuid)

    if (war.status !== WarStatus.PROPOSED) {
        throw createError({
            statusCode: 400,
            statusMessage: 'War already processed',
            data: { statusMessageRu: 'Война уже обработана' }
        })
    }

    const row = await db().prepare(
        'SELECT 1 FROM war_participants WHERE war_uuid = ? AND state_uuid = ? AND side_role = ?'
    ).get(warUuid, defenderStateUuid, WarSideRole.DEFENDER)
    if (!row) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Defender not found',
            data: { statusMessageRu: 'Государство не является защитником в этой войне' }
        })
    }

    if (!await isRoleHigherOrEqual(defenderStateUuid, defenderPlayerUuid, RolesInState.DIPLOMAT)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для ответа на объявление войны' }
        })
    }

    const newStatus = accept ? WarStatus.ACCEPTED : WarStatus.DECLINED
    await db().prepare('UPDATE wars SET status = ?, updated = ? WHERE uuid = ?').run(newStatus, Date.now(), warUuid)
}

export async function scheduleWar(warUuid: string, adminUuid: string): Promise<void> {
    if (!await isUserAdmin(adminUuid)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав администратора' }
        })
    }

    const war = await getWarByUuid(warUuid)
    if (war.status !== WarStatus.ACCEPTED) {
        throw createError({
            statusCode: 400,
            statusMessage: 'War must be accepted',
            data: { statusMessageRu: 'Война должна быть принята' }
        })
    }

    await db().prepare('UPDATE wars SET status = ?, updated = ? WHERE uuid = ?').run(WarStatus.SCHEDULED, Date.now(), warUuid)
}

export async function startWar(warUuid: string, adminUuid: string): Promise<void> {
    if (!await isUserAdmin(adminUuid)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав администратора' }
        })
    }
    const war = await getWarByUuid(warUuid)
    if (war.status !== WarStatus.SCHEDULED) {
        throw createError({
            statusCode: 400,
            statusMessage: 'War not scheduled',
            data: { statusMessageRu: 'Война не назначена' }
        })
    }
    await db().prepare('UPDATE wars SET status = ?, updated = ? WHERE uuid = ?').run(WarStatus.ONGOING, Date.now(), warUuid)
}

export async function finishWar(
    warUuid: string,
    result: string,
    resultAction: string,
    adminUuid: string
): Promise<void> {
    if (!await isUserAdmin(adminUuid)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав администратора' }
        })
    }
    const war = await getWarByUuid(warUuid)
    if (war.status !== WarStatus.ONGOING && war.status !== WarStatus.SCHEDULED) {
        throw createError({
            statusCode: 400,
            statusMessage: 'War not active',
            data: { statusMessageRu: 'Война не активна' }
        })
    }

    const now = Date.now()
    await db().prepare(
        'UPDATE wars SET status = ?, result = ?, result_action = ?, updated = ? WHERE uuid = ?'
    ).run(WarStatus.ENDED, result, resultAction, now, warUuid)

    const hist: IHistoryEvent = {
        uuid: uuidv4(),
        created: now,
        updated: now,
        type: HistoryEventType.WAR_FINISHED,
        title: 'Война завершена',
        description: result,
        state_uuids: null,
        alliance_uuids: null,
        player_uuids: [adminUuid],
        war_uuid: warUuid,
        city_uuids: null,
        details_json: JSON.stringify({ resultAction }),
        created_by_uuid: adminUuid,

        season: null,
        is_deleted: false,
        deleted_at: null,
        deleted_by_uuid: null,
    }
    await addHistoryEvent(hist)
}

export async function createBattle(
    warUuid: string,
    creatorStateUuid: string,
    creatorPlayerUuid: string,
    name: string,
    description: string,
    type: BattleType,
    startDate: number
): Promise<string> {
    await getWarByUuid(warUuid)
    const participant = await db().prepare(
        'SELECT 1 FROM war_participants WHERE war_uuid = ? AND state_uuid = ?'
    ).get(warUuid, creatorStateUuid)
    if (!participant) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not participant',
            data: { statusMessageRu: 'Государство не участвует в войне' }
        })
    }
    if (!await isRoleHigherOrEqual(creatorStateUuid, creatorPlayerUuid, RolesInState.OFFICER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав для создания сражения' }
        })
    }
    const now = Date.now()
    const battleUuid = uuidv4()
    await db().prepare(`
        INSERT INTO war_battles (
            uuid, created, updated,
            war_uuid, name, description,
            type, status, result,
            start_date, end_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL)
    `).run(battleUuid, now, now, warUuid, name, description, type, BattleStatus.SCHEDULED, startDate)

    const hist: IHistoryEvent = {
        uuid: uuidv4(),
        created: now,
        updated: now,
        type: HistoryEventType.WAR_BATTLE,
        title: 'Назначено сражение',
        description: name,
        state_uuids: [creatorStateUuid],
        alliance_uuids: null,
        player_uuids: [creatorPlayerUuid],
        war_uuid: warUuid,
        city_uuids: null,
        details_json: JSON.stringify({ type, description }),
        created_by_uuid: creatorPlayerUuid,

        season: null,
        is_deleted: false,
        deleted_at: null,
        deleted_by_uuid: null,
    }
    await addHistoryEvent(hist)

    return battleUuid
}

export async function updateBattleStatus(
    battleUuid: string,
    status: BattleStatus,
    updaterUuid: string,
    result?: string,
    endDate?: number
): Promise<void> {
    if (!await isUserAdmin(updaterUuid)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Недостаточно прав' }
        })
    }
    const row = await db().prepare('SELECT * FROM war_battles WHERE uuid = ?').get(battleUuid) as IWarBattle | undefined
    if (!row) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Battle not found',
            data: { statusMessageRu: 'Сражение не найдено' }
        })
    }
    await db().prepare(
        'UPDATE war_battles SET status = ?, result = ?, end_date = ?, updated = ? WHERE uuid = ?'
    ).run(status, result ?? row.result, endDate ?? row.end_date, Date.now(), battleUuid)
}

export async function getWarByUuid(uuid: string): Promise<IWar> {
    const row = await db().prepare('SELECT * FROM wars WHERE uuid = ?').get(uuid) as IWar | undefined
    if (!row) {
        throw createError({
            statusCode: 404,
            statusMessage: 'War not found',
            data: { statusMessageRu: 'Война не найдена' }
        })
    }
    return row
}

export async function listWarBattles(warUuid: string): Promise<IWarBattle[]> {
    await getWarByUuid(warUuid)
    return (await db().prepare('SELECT * FROM war_battles WHERE war_uuid = ? ORDER BY start_date').all(warUuid)) as IWarBattle[]
}
