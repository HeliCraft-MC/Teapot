import { v4 as uuidv4 } from 'uuid'
import {getStateByUuid} from "~/utils/states/state.utils";
import {RolesInState} from "~/interfaces/state/state.types";
import {ResultSetHeader, RowDataPacket} from "mysql2";
import {useMySQL} from "~/plugins/mySql";

export async function applyForMembership(stateUuid: string, applicantUuid: string): Promise<void> {
    if (!await getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: {statusMessageRu: 'Государство не найдено'}
        });
    }

    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const isAlreadyMember = await db.prepare('SELECT COUNT(*) as count FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    //     .get(stateUuid, applicantUuid) as { count: number };

    const checkSql = 'SELECT COUNT(*) as count FROM state_members WHERE state_uuid = ? AND player_uuid = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(checkSql, [stateUuid, applicantUuid]);
    const isAlreadyMember = rows[0] as { count: number };

    if (isAlreadyMember.count > 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Already a member',
            data: { statusMessageRu: 'Уже является участником или заявка отправлена' }
        });
    }

    if (await isDualCitizenshipAllowed(applicantUuid) == false) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Dual citizenship not allowed',
            data: { statusMessageRu: 'Двойное гражданство не разрешено' }
        });
    }

    // DEPRECATED, keeping this for info
    // const req = db.prepare('INSERT INTO state_members (uuid, created, updated, state_uuid, city_uuid, player_uuid, role) VALUES (?, ?, ?, ?, ?, ?, ?)');
    // req.run(
    //     uuidv4(),
    //     Date.now(),
    //     Date.now(),
    //     stateUuid,
    //     null,
    //     applicantUuid,
    //     RolesInState.APPLICANT
    // );

    const insertSql = `
        INSERT INTO state_members (uuid, created, updated, state_uuid, city_uuid, player_uuid, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        uuidv4(),
        Date.now(),
        Date.now(),
        stateUuid,
        null,
        applicantUuid,
        RolesInState.APPLICANT
    ];

    const [result] = await pool.execute<ResultSetHeader>(insertSql, values);

    if (result.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to apply for membership',
            data: { statusMessageRu: 'Не удалось отправить заявку на вступление' }
        });
    }
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

    const pool = useMySQL('states');

    if (approve) {
        // DEPRECATED, keeping this for info
        // const req = db.prepare('UPDATE state_members SET role = ?, updated = ? WHERE state_uuid = ? AND player_uuid = ?');
        // req.run(RolesInState.CITIZEN, Date.now(), stateUuid, applicantUuid);

        const sql = 'UPDATE state_members SET role = ?, updated = ? WHERE state_uuid = ? AND player_uuid = ?';
        const values = [RolesInState.CITIZEN, Date.now(), stateUuid, applicantUuid];

        const [result] = await pool.execute<ResultSetHeader>(sql, values);

        if (result.affectedRows === 0) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to approve membership',
                data: { statusMessageRu: 'Не удалось одобрить заявку' }
            });
        }
    } else {
        // DEPRECATED, keeping this for info
        // const req = db.prepare('DELETE FROM state_members WHERE state_uuid = ? AND player_uuid = ?');
        // req.run(stateUuid, applicantUuid);

        const sql = 'DELETE FROM state_members WHERE state_uuid = ? AND player_uuid = ?';
        const values = [stateUuid, applicantUuid];

        const [result] = await pool.execute<ResultSetHeader>(sql, values);

        if (result.affectedRows === 0) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to reject membership',
                data: { statusMessageRu: 'Не удалось отклонить заявку' }
            });
        }
    }
}


export async function removeMember(stateUuid: string, uuidToRemove: string, uuidWhoRemoved: string): Promise<void> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        });
    }

    const hasPermission = await isRoleHigherOrEqual(stateUuid, uuidWhoRemoved, RolesInState.OFFICER, [RolesInState.DIPLOMAT]);
    if (!hasPermission) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Insufficient permissions',
            data: { statusMessageRu: 'Недостаточно прав' }
        });
    }

    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const req = db.prepare('DELETE FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    // req.run(stateUuid, uuidToRemove)

    const sql = 'DELETE FROM state_members WHERE state_uuid = ? AND player_uuid = ?';
    const values = [stateUuid, uuidToRemove];

    const [result] = await pool.execute<ResultSetHeader>(sql, values);

    if (result.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to remove member',
            data: { statusMessageRu: 'Не удалось удалить участника' }
        });
    }
}


export async function getMembers(stateUuid: string, startAt: number = 0, limit: number = 0): Promise<any[]> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        });
    }

    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const req = db.prepare('SELECT * FROM state_members WHERE state_uuid = ? ORDER BY created DESC LIMIT ? OFFSET ?')
    // const members = await req.all(stateUuid, limit || 100, startAt) as any[]

    const sql = 'SELECT * FROM state_members WHERE state_uuid = ? ORDER BY created DESC LIMIT ? OFFSET ?';
    const values = [stateUuid, limit || 100, startAt];

    const [rows] = await pool.execute<RowDataPacket[]>(sql, values);

    return rows as any[];
}


export async function getStateMembersCount(stateUuid: string): Promise<number> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        });
    }

    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const req = db.prepare('SELECT COUNT(*) as count FROM state_members WHERE state_uuid = ?')
    // const result = await req.get(stateUuid) as { count: number }

    const sql = 'SELECT COUNT(*) as count FROM state_members WHERE state_uuid = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [stateUuid]);
    const result = rows[0] as { count: number };

    return result.count;
}


export async function getMember(stateUuid: string, playerUuid: string): Promise<any> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        });
    }

    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const req = db.prepare('SELECT * FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    // const member = await req.get(stateUuid, playerUuid) as any

    const sql = 'SELECT * FROM state_members WHERE state_uuid = ? AND player_uuid = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [stateUuid, playerUuid]);
    const member = rows[0] as any;

    if (!member) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Member not found',
            data: { statusMessageRu: 'Участник не найден' }
        });
    }

    return member;
}


export async function isPlayerRulerSomewhere(playerUuid: string): Promise<boolean> {
    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const req = db.prepare('SELECT COUNT(*) as count FROM state_members WHERE player_uuid = ? AND role = ?')
    // const result = await req.get(playerUuid, RolesInState.RULER) as { count: number }

    const sql = 'SELECT COUNT(*) as count FROM state_members WHERE player_uuid = ? AND role = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [playerUuid, RolesInState.RULER]);
    const result = rows[0] as { count: number };

    return result.count > 0;
}


export async function isDiplomaticActionsAllowedForPlayer(playerUuid: string) {
    const pool = useMySQL('states');

    const allowedRoles = [
        RolesInState.DIPLOMAT,
        RolesInState.MINISTER,
        RolesInState.VICE_RULER,
        RolesInState.RULER
    ];

    if (allowedRoles.length === 0) {
        return [];
    }

    const placeholders = allowedRoles.map(() => '?').join(',');

    // DEPRECATED, keeping this for info
    // const sqlQuery = `SELECT state_uuid, role FROM state_members WHERE player_uuid = ? AND role IN (${placeholders})`;
    // const params = [playerUuid, ...allowedRoles];
    // const req = db.prepare(sqlQuery);
    // const rows = await req.all(...params) as { state_uuid: string, role: string }[];

    const sql = `SELECT state_uuid, role FROM state_members WHERE player_uuid = ? AND role IN (${placeholders})`;
    const params = [playerUuid, ...allowedRoles];

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

    return (rows as { state_uuid: string; role: string }[]).map(row => ({
        stateUuid: row.state_uuid,
        isDiplomaticActionsAllowed: true
    }));
}


export async function isPlayerInAnyState(playerUuid: string): Promise<boolean> {
    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const req = db.prepare('SELECT COUNT(*) as count FROM state_members WHERE player_uuid = ?')
    // const result = await req.get(playerUuid) as { count: number }

    const sql = 'SELECT COUNT(*) as count FROM state_members WHERE player_uuid = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [playerUuid]);
    const result = rows[0] as { count: number };

    return result.count > 0;
}


export async function getPlayerStates(playerUuid: string): Promise<any[]> {
    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const req = db.prepare('SELECT * FROM state_members WHERE player_uuid = ?')
    // const states = await req.all(playerUuid) as any[]

    const sql = 'SELECT * FROM state_members WHERE player_uuid = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [playerUuid]);

    return rows as any[];
}


export async function isDualCitizenshipAllowed(playerUuid: string): Promise<boolean | null> {
    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const req = db.prepare('SELECT state_uuid FROM state_members WHERE player_uuid = ?')
    // const states = await req.all(playerUuid) as { state_uuid: string }[];

    const sqlStates = 'SELECT state_uuid FROM state_members WHERE player_uuid = ?';
    const [statesRows] = await pool.execute<RowDataPacket[]>(sqlStates, [playerUuid]);
    const states = statesRows as { state_uuid: string }[];

    if (states.length === 0) {
        return null; // No states found for the player
    }

    const stateUuids = states.map(s => s.state_uuid);
    const placeholders = stateUuids.map(() => '?').join(',');

    // DEPRECATED, keeping this for info
    // const stateReq = db.prepare(`SELECT allow_dual_citizenship FROM states WHERE uuid IN (${placeholders})`)
    // const stateAllowDual = await stateReq.all(...stateUuids) as { allow_dual_citizenship: boolean }[];

    const sqlDual = `SELECT allow_dual_citizenship FROM states WHERE uuid IN (${placeholders})`;
    const [dualRows] = await pool.execute<RowDataPacket[]>(sqlDual, stateUuids);
    const stateAllowDual = dualRows as { allow_dual_citizenship: boolean }[];

    if (stateAllowDual.length === 0) {
        return null; // No states found with dual citizenship setting
    }

    const allAllowDual = stateAllowDual.every(s => s.allow_dual_citizenship);
    return allAllowDual;
}


export async function isPlayerInState(stateUuid: string, playerUuid: string): Promise<boolean> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        });
    }

    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const req = db.prepare('SELECT COUNT(*) as count FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    // const result = await req.get(stateUuid, playerUuid) as { count: number }

    const sql = 'SELECT COUNT(*) as count FROM state_members WHERE state_uuid = ? AND player_uuid = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [stateUuid, playerUuid]);
    const result = rows[0] as { count: number };

    return result.count > 0;
}


export async function getStateMemberRole(stateUuid: string, playerUuid: string): Promise<RolesInState | null> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        });
    }

    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const req = db.prepare('SELECT role FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    // const result = await req.get(stateUuid, playerUuid) as { role: RolesInState } | undefined

    const sql = 'SELECT role FROM state_members WHERE state_uuid = ? AND player_uuid = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [stateUuid, playerUuid]);
    const result = rows[0] as { role: RolesInState } | undefined;

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
        });
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

    // 5. Проверка допустимости роли
    const allRoles: RolesInState[] = Object.values(RolesInState);
    if (!allRoles.includes(newRole)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid role",
            data: { statusMessageRu: "Недопустимая роль" }
        });
    }

    // 6. Получение текущих ролей
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
        throw createError({
            statusCode: 404,
            statusMessage: "Member not found",
            data: { statusMessageRu: "Игрок не найден среди участников государства" }
        });
    }

    // 7. Определение рангов
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

    // 8. Проверки на полномочия
    if (updaterRank <= targetRank) {
        throw createError({
            statusCode: 403,
            statusMessage: "Insufficient permissions",
            data: { statusMessageRu: "Недостаточно прав для смены данной роли участника" }
        });
    }

    if (updaterRank <= newRoleRank && newRole !== RolesInState.RULER) {
        throw createError({
            statusCode: 403,
            statusMessage: "Insufficient permissions",
            data: { statusMessageRu: "Недостаточно прав для присвоения такой роли" }
        });
    }

    const pool = useMySQL("states");

    if (newRole === RolesInState.RULER) {
        if (updaterRole !== RolesInState.RULER) {
            throw createError({
                statusCode: 403,
                statusMessage: "Only current ruler can assign new ruler",
                data: { statusMessageRu: "Только текущий глава может назначить нового главу" }
            });
        }

        // DEPRECATED, keeping this for info
        // const downgradeStmt = useDatabase("states").prepare(`
        //     UPDATE state_members
        //     SET role = ?, updated = ?
        //     WHERE state_uuid = ? AND player_uuid = ?
        // `);
        // await downgradeStmt.run(RolesInState.VICE_RULER, Date.now(), stateUuid, updaterUuid);

        const downgradeSql = `
            UPDATE state_members
            SET role = ?, updated = ?
            WHERE state_uuid = ? AND player_uuid = ?
        `;
        const [downgradeRes] = await pool.execute<ResultSetHeader>(downgradeSql, [
            RolesInState.VICE_RULER,
            Date.now(),
            stateUuid,
            updaterUuid
        ]);

        if (downgradeRes.affectedRows === 0) {
            throw createError({
                statusCode: 500,
                statusMessage: "Failed to downgrade current ruler",
                data: { statusMessageRu: "Не удалось понизить текущего главу" }
            });
        }
    }

    // DEPRECATED, keeping this for info
    // const stmt = db.prepare(`
    //     UPDATE state_members
    //     SET role = ?, updated = ?
    //     WHERE state_uuid = ? AND player_uuid = ?
    // `);
    // await stmt.run(newRole, Date.now(), stateUuid, playerUuid);

    const updateSql = `
        UPDATE state_members 
        SET role = ?, updated = ? 
        WHERE state_uuid = ? AND player_uuid = ?
    `;
    const [updateRes] = await pool.execute<ResultSetHeader>(updateSql, [
        newRole,
        Date.now(),
        stateUuid,
        playerUuid
    ]);

    if (updateRes.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: "Failed to update member role",
            data: { statusMessageRu: "Не удалось обновить роль участника" }
        });
    }
}


export async function leaveState(stateUuid: string, playerUuid: string): Promise<void> {
    if (!getStateByUuid(stateUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        });
    }

    if (await getStateMemberRole(stateUuid, playerUuid) === RolesInState.RULER) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Cannot leave as ruler',
            data: { statusMessageRu: 'Нельзя покинуть государство, будучи главой' }
        });
    }

    if (!await isPlayerInState(stateUuid, playerUuid)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Player not found in state',
            data: { statusMessageRu: 'Игрок не найден в государстве' }
        });
    }

    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const db = useDatabase('states')
    // const req = db.prepare('DELETE FROM state_members WHERE state_uuid = ? AND player_uuid = ?')
    // await req.run(stateUuid, playerUuid)

    const sql = 'DELETE FROM state_members WHERE state_uuid = ? AND player_uuid = ?';
    const [result] = await pool.execute<ResultSetHeader>(sql, [stateUuid, playerUuid]);

    if (result.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to leave state',
            data: { statusMessageRu: 'Не удалось выйти из государства' }
        });
    }
}


