import { v4 as uuidv4 } from 'uuid'
import {getStateByUuid} from "~/utils/states/state.utils";
import {RolesInState} from "~/interfaces/state/state.types";

export async function addMember(stateUuid: string, uuidToAdd: string, uuidWhoAdded: string): Promise<void>{
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }
    // TODO check if uuidWhoAdded has rights to add members
    const db = useDatabase('states')
    const req = db.prepare('INSERT INTO state_members (uuid, created, updated, state_uuid, city_uuid, player_uuid, role) VALUES (?, ?, ?, ?, ?, ?, ?)')
    req.run(
        uuidv4(),
        Date.now(),
        Date.now(),
        stateUuid,
        null, // city_uuid can be null for state members
        uuidToAdd,
        'member' // default role for new members
    )
}

export async function removeMember(stateUuid: string, uuidToRemove: string, uuidWhoRemoved: string): Promise<void> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }
    // TODO check if uuidWhoRemoved has rights to remove members
    const db = useDatabase('states')
    const req = db.prepare('DELETE FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    req.run(stateUuid, uuidToRemove)
}

export async function getMembers(stateUuid: string, startAt: number = 0, limit: number = 0): Promise<any[]> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }
    const db = useDatabase('states')
    const req = db.prepare('SELECT * FROM state_members WHERE state_uuid = ? ORDER BY created DESC LIMIT ? OFFSET ?')
    const members = await req.all(stateUuid, limit || 100, startAt) as any[]
    return members
}

export async function getStateMembersCount(stateUuid: string): Promise<number> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }
    const db = useDatabase('states')
    const req = db.prepare('SELECT COUNT(*) as count FROM state_members WHERE state_uuid = ?')
    const result = await req.get(stateUuid) as { count: number }
    return result.count
}

export async function getMember(stateUuid: string, playerUuid: string): Promise<any> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }
    const db = useDatabase('states')
    const req = db.prepare('SELECT * FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    const member = await req.get(stateUuid, playerUuid) as any
    if (!member) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Member not found',
            data: { statusMessageRu: 'Участник не найден' }
        })
    }
    return member
}

export async function getPlayerStates(playerUuid: string): Promise<any[]> {
    const db = useDatabase('states')
    const req = db.prepare('SELECT * FROM state_members WHERE player_uuid = ?')
    const states = await req.all(playerUuid) as any[]
    return states
}

export async function isDualCitizenshipAllowed(playerUuid: string): Promise<boolean | null> {
    const db = useDatabase('states')
    // get all states where playerUuid is a member then getstatesbyuuid and check id dualcitezenship allowed
    const req = db.prepare('SELECT state_uuid FROM state_members WHERE player_uuid = ?')
    const states = await req.all(playerUuid) as { state_uuid: string }[];
    if (states.length === 0) {
        return null; // No states found for the player
    }
    const stateUuids = states.map(s => s.state_uuid);
    const placeholders = stateUuids.map(() => '?').join(',');
    const stateReq = db.prepare(`SELECT allow_dual_citizenship FROM states WHERE uuid IN (${placeholders})`)
    const stateAllowDual = await stateReq.all(...stateUuids) as { allow_dual_citizenship: boolean }[];
    if (stateAllowDual.length === 0) {
        return null; // No states found with dual citizenship setting
    }
    // Check if all states allow dual citizenship
    const allAllowDual = stateAllowDual.every(s => s.allow_dual_citizenship);
    return allAllowDual;
}

export async function isPlayerInState(stateUuid: string, playerUuid: string): Promise<boolean> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }
    const db = useDatabase('states')
    const req = db.prepare('SELECT COUNT(*) as count FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    const result = await req.get(stateUuid, playerUuid) as { count: number }
    return result.count > 0;
}

export async function getStateMemberRole(stateUuid: string, playerUuid: string): Promise<RolesInState | null> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }
    const db = useDatabase('states')
    const req = db.prepare('SELECT role FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    const result = await req.get(stateUuid, playerUuid) as { role: RolesInState } | undefined
    return result ? result.role : null;
}

export async function updateMemberRole(stateUuid: string, playerUuid: string, updaterUuid: string, newRole: RolesInState): Promise<void> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }
    if (!(newRole == RolesInState.RULER || newRole == RolesInState.MINISTER || newRole == RolesInState.VICE_RULER)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid role',
            data: { statusMessageRu: 'Недопустимая роль' }
        })
    }
    const db = useDatabase('states')
    const req = db.prepare('UPDATE state_members SET role = ?, updated = ? WHERE state_uuid = ? AND player_uuid = ?')
    req.run(newRole, Date.now(), stateUuid, playerUuid)
}