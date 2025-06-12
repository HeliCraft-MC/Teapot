import { v4 as uuidv4 } from 'uuid'
import {getStateByUuid} from "~/utils/states/state.utils";
import {RolesInState} from "~/interfaces/state/state.types";

export async function applyForMembership(stateUuid: string, applicantUuid: string): Promise<void> {
    if (!await getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: {statusMessageRu: 'Государство не найдено'}
        });
    }
    const db = useDatabase('states');
    const isAlreadyMember = await db.prepare('SELECT COUNT(*) as count FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
        .get(stateUuid, applicantUuid) as { count: number };
    if (isAlreadyMember.count > 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Already a member',
            data: { statusMessageRu: 'Уже является участником или заявка отправлена' }
        });
    }
    if(await isDualCitizenshipAllowed(applicantUuid) == false) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Dual citizenship not allowed',
            data: { statusMessageRu: 'Двойное гражданство не разрешено' }
        });
    }
    const req = db.prepare('INSERT INTO state_members (uuid, created, updated, state_uuid, city_uuid, player_uuid, role) VALUES (?, ?, ?, ?, ?, ?, ?)');
        req.run(
            uuidv4(),
            Date.now(),
            Date.now(),
            stateUuid,
        null,
        applicantUuid,
        RolesInState.APPLICANT
    );
}

export async function reviewMembershipApplication(
    stateUuid: string,
    applicantUuid: string,
    reviewerUuid: string,
    approve: boolean
): Promise<void> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        });
    }
    const hasPermission = await isRoleHigherOrEqual(stateUuid, reviewerUuid, RolesInState.OFFICER, [RolesInState.DIPLOMAT]);
    if (!hasPermission) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Insufficient permissions',
            data: { statusMessageRu: 'Недостаточно прав' }
        });
    }
    const db = useDatabase('states');
    if (approve) {
        const req = db.prepare('UPDATE state_members SET role = ?, updated = ? WHERE state_uuid = ? AND player_uuid = ?');
        req.run(RolesInState.CITIZEN, Date.now(), stateUuid, applicantUuid);
    } else {
        const req = db.prepare('DELETE FROM state_members WHERE state_uuid = ? AND player_uuid = ?');
        req.run(stateUuid, applicantUuid);
    }
}

export async function removeMember(stateUuid: string, uuidToRemove: string, uuidWhoRemoved: string): Promise<void> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }
    const hasPermission = await isRoleHigherOrEqual(stateUuid, uuidWhoRemoved, RolesInState.OFFICER, [RolesInState.DIPLOMAT]);
    if (!hasPermission) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Insufficient permissions',
            data: { statusMessageRu: 'Недостаточно прав' }
        });
    }
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

export async function isPlayerRulerSomewhere(playerUuid: string): Promise<boolean> {
    const db = useDatabase('states')
    const req = db.prepare('SELECT COUNT(*) as count FROM state_members WHERE player_uuid = ? AND role = ?')
    const result = await req.get(playerUuid, RolesInState.RULER) as { count: number }
    return result.count > 0
}

export async function isDiplomaticActionsAllowedForPlayer(playerUuid: string) {
    const db = useDatabase('states');
    const req = db.prepare(
        'SELECT state_uuid FROM state_members WHERE player_uuid = ? AND role IN (?, ?, ?, ?)'
    );
    const rows = await req.all(
        playerUuid,
        RolesInState.DIPLOMAT,
        RolesInState.MINISTER,
        RolesInState.VICE_RULER,
        RolesInState.RULER
    ) as { state_uuid: string }[];
    return rows.map(row => ({
        stateUuid: row.state_uuid,
                isDiplomaticActionsAllowed: true
    }));
}

export async function isPlayerInAnyState(playerUuid: string): Promise<boolean> {
    const db = useDatabase('states')
    const req = db.prepare('SELECT COUNT(*) as count FROM state_members WHERE player_uuid = ?')
    const result = await req.get(playerUuid) as { count: number }
    return result.count > 0
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

export async function isRoleHigherOrEqual(
    stateUuid: string,
    playerUuid: string,
    roleToCheck: RolesInState,
    excludedRoles: RolesInState[] = []
): Promise<boolean> {
   const memberRole = await getStateMemberRole(stateUuid, playerUuid);
    if (!memberRole) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Member not found',
            data: { statusMessageRu: 'Участник не найден' }
        })
    }
    if (excludedRoles.includes(memberRole)) {
        return false;
    }
    const rolesOrder = [
        RolesInState.APPLICANT,
        RolesInState.CITIZEN,
        RolesInState.OFFICER,
        RolesInState.DIPLOMAT,
        RolesInState.MINISTER,
        RolesInState.VICE_RULER,
        RolesInState.RULER
    ];
    return rolesOrder.indexOf(memberRole) >= rolesOrder.indexOf(roleToCheck);
}

export async function updateMemberRole(
    stateUuid: string,
    playerUuid: string,
    updaterUuid: string,
    newRole: RolesInState
): Promise<void> {
    // 1. Проверяем существование государства
    if (!await getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: "State not found",
            data: { statusMessageRu: "Государство не найдено" }
        });
    }

    // 2. Запрещаем менять собственную роль напрямую
    if (playerUuid === updaterUuid) {
        throw createError({
            statusCode: 400,
            statusMessage: "Cannot change own role",
            data: { statusMessageRu: "Нельзя самостоятельно менять себе роль" }
        });
    }

    // 3. Проверяем, что у игрока-цели уже есть членство в этом государстве
    const isTargetInState = await isPlayerInState(stateUuid, playerUuid);
    if (!isTargetInState) {
        throw createError({
            statusCode: 404,
            statusMessage: "Member not found",
            data: { statusMessageRu: "Игрок не является участником государства" }
        });
    }

    // 4. Проверяем, что инициатор состоит в этом же государстве
    const isUpdaterInState = await isPlayerInState(stateUuid, updaterUuid);
    if (!isUpdaterInState) {
        throw createError({
            statusCode: 403,
            statusMessage: "Insufficient permissions",
            data: { statusMessageRu: "Не состоит в данном государстве" }
        });
    }

    // 5. Проверяем корректность новой роли: она должна быть одним из перечисленных значений RolesInState
    //    (т.к. newRole уже типизирована RolesInState, обычно этой проверки достаточно).
    const allRoles: RolesInState[] = Object.values(RolesInState);
    if (!allRoles.includes(newRole)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid role",
            data: { statusMessageRu: "Недопустимая роль" }
        });
    }

    // 6. Получаем текущие роли инициатора и цели
    const updaterRole = await getStateMemberRole(stateUuid, updaterUuid);
    const targetRole = await getStateMemberRole(stateUuid, playerUuid);

    if (!updaterRole) {
        throw createError({
            statusCode: 404,
            statusMessage: "Updater not found",
            data: { statusMessageRu: "Инициатор не найден среди членов государства" }
        });
    }
    if (!targetRole) {
        // на всякий случай, хотя уже проверяли isPlayerInState
        throw createError({
            statusCode: 404,
            statusMessage: "Member not found",
            data: { statusMessageRu: "Игрок не найден среди участников государства" }
        });
    }

    // 7. Определяем порядок ролей для сравнения рангов
    const rolesOrder: RolesInState[] = [
        RolesInState.APPLICANT,
        RolesInState.CITIZEN,
        RolesInState.OFFICER,
        RolesInState.DIPLOMAT,
        RolesInState.MINISTER,
        RolesInState.VICE_RULER,
        RolesInState.RULER
    ];

    const updaterRank = rolesOrder.indexOf(updaterRole);
    const targetRank = rolesOrder.indexOf(targetRole);
    const newRoleRank = rolesOrder.indexOf(newRole);

    // 8. Проверяем, что инициатор имеет более высокий ранг, чем у цели
    if (updaterRank <= targetRank) {
        throw createError({
            statusCode: 403,
            statusMessage: "Insufficient permissions",
            data: { statusMessageRu: "Недостаточно прав для смены данной роли участника" }
        });
    }

    // 9. Проверяем, что инициатор не пытается присвоить роль равную или выше своей собственной
    if (updaterRank <= newRoleRank && newRole !== RolesInState.RULER) {
        throw createError({
            statusCode: 403,
            statusMessage: "Insufficient permissions",
            data: { statusMessageRu: "Недостаточно прав для присвоения такой роли" }
        });
    }

    if (newRole === RolesInState.RULER) {
        if (updaterRole !== RolesInState.RULER) {
            throw createError({
                statusCode: 403,
                statusMessage: "Only current ruler can assign new ruler",
                data: { statusMessageRu: "Только текущий глава может назначить нового главу" }
            });
        }
        // Понижаем текущего правителя (updatorUuid) до вице-главы
        const downgradeStmt = useDatabase("states").prepare(`
        UPDATE state_members
        SET role = ?, updated = ?
        WHERE state_uuid = ? AND player_uuid = ?
        `);
        await downgradeStmt.run(RolesInState.VICE_RULER, Date.now(), stateUuid, updaterUuid);
    }

    // 11. Всё ок, обновляем роль в БД
    const db = useDatabase("states");
    const stmt = db.prepare(`
    UPDATE state_members 
    SET role = ?, updated = ? 
    WHERE state_uuid = ? AND player_uuid = ?
  `);

    await stmt.run(newRole, Date.now(), stateUuid, playerUuid);
}

export async function leaveState(stateUuid: string, playerUuid: string): Promise<void> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }
    if (await getStateMemberRole(stateUuid, playerUuid) === RolesInState.RULER) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Cannot leave as ruler',
            data: { statusMessageRu: 'Нельзя покинуть государство, будучи главой' }
        })
    }
    if (!await isPlayerInState(stateUuid, playerUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Player not found in state',
            data: { statusMessageRu: 'Игрок не найден в государстве' }
        })
    }
    const db = useDatabase('states')
    const req = db.prepare('DELETE FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    await req.run(stateUuid, playerUuid)
}

