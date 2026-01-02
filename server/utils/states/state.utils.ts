import {GovernmentForm, StateStatus, IStateMember, IState, RolesInState} from '~/interfaces/state/state.types'
import { IHistoryEvent, HistoryEventType } from "~/interfaces/state/history.types";
import { v4 as uuidv4 } from 'uuid'
import { promises as fsp } from 'node:fs'
import { join, dirname } from 'pathe'
import {isUserAdmin} from "~/utils/user.utils";
import {addHistoryEvent} from "~/utils/states/history.utils";
import {
    getPlayerStates,
    isPlayerInAnyState,
    isPlayerInState,
    isPlayerRulerSomewhere
} from "~/utils/states/citizenship.utils";
import {useMySQL} from "~/plugins/mySql";
import {ResultSetHeader, RowDataPacket} from "mysql2";

const MAX_NAME_LEN = 32
const MIN_NAME_LEN = 3


const strictHexColor = /^#[0-9a-f]{6}$/i
const nameRegex = /^[a-zA-Z0-9а-яА-ЯёЁ\s]+$/


function assertColor(color: string) {
    if (!strictHexColor.test(color)) {
        throw createError({
            statusCode: 422,
            statusMessage: 'Invalid color',
            data: { statusMessageRu: 'Неверный цвет (ожидается #RRGGBB)' }
        })
    }
}

/**
 * Checks if the state name is valid and checks if it already exists in the database.
 * @param name
 * @param throwIfExists
 * @return {Promise<boolean>} Returns true if the state exists and throwIfExists is false.
 */
async function assertState(name: string, throwIfExists: boolean) : Promise<boolean>;

/**
 * Checks if the state name is valid.
 * @param name
 * @returns {Promise<void>}
 */
async function assertState(name: string) : Promise<void>;

async function assertState(name: string, throwIfExists?: boolean): Promise<void | boolean> {
    if (!name.trim() || name.length > MAX_NAME_LEN || name.length < MIN_NAME_LEN || !nameRegex.test(name)) {
        throw createError({
            statusCode: 422,
            statusMessage: 'Invalid name',
            data: { statusMessageRu: 'Название пустое либо слишком длинное' }
        });
    }

    if (throwIfExists != undefined) {
        const pool = useMySQL('states');

        // DEPRECATED, keeping this for info
        // const sql = db().prepare('SELECT * FROM states WHERE LOWER(name) = ?')
        // const existing = await sql.get(name.toLowerCase()) as IState | undefined

        const sql = 'SELECT * FROM `states` WHERE LOWER(`name`) = ?';
        const [rows] = await pool.execute<RowDataPacket[]>(sql, [name.toLowerCase()]);
        const existing = rows[0] as IState | undefined;

        if (existing) {
            if (throwIfExists === true) {
                throw createError({
                    statusCode: 409,
                    statusMessage: 'State with this name already exists',
                    data: { statusMessageRu: 'Государство с таким названием уже существует' }
                });
            } else {
                return true;
            }
        }
        return false;
    }

    return;
}


/**
 * Converts a flag image (Buffer) to a link (Uploads image to { uploadDir = './uploads' } = useRuntimeConfig()).
 * @param flag
 * @returns {Promise<string>} Returns the link to the uploaded flag image.
 */
async function flagToUploads(flag: Buffer): Promise<string> {
    const { uploadDir = './uploads' } = useRuntimeConfig()
    const hex = uuidv4().replace(/-/g, '')
    const rel = `flags/${hex.slice(0, 2)}/${hex.slice(2, 4)}/${hex.slice(4, 6)}/${hex}.png`
    const abs = join(uploadDir, rel)

    await fsp.mkdir(dirname(abs), { recursive: true })
    await fsp.writeFile(abs, flag)

    return rel
}

/**
 * Рекурсивно удаляет пустые директории внутри заданного корня
 */
async function removeEmptyDirs(root: string): Promise<void> {
    let entries: string[]
    try {
        entries = await fsp.readdir(root)
    } catch {
        return
    }
    for (const name of entries) {
        const fullPath = join(root, name)
        const stat = await fsp.stat(fullPath)
        if (stat.isDirectory()) {
            await removeEmptyDirs(fullPath)
            const rem = await fsp.readdir(fullPath)
            if (rem.length === 0) {
                await fsp.rmdir(fullPath)
            }
        }
    }
}

/**
 * Обновляет флаг существующего государства:
 * – удаляет старый локальный файл,
 * – загружает новый,
 * – сохраняет в БД и чистит пустые папки.
 */
export async function updateStateFlag(stateUuid: string, flag: Buffer | string): Promise<string> {
    // Проверяем, что штат существует
    await getStateByUuid(stateUuid);

    const pool = useMySQL('states');
    const { uploadDir = './uploads' } = useRuntimeConfig();
    const flagsRoot = join(uploadDir, 'flags');

    // Удаляем старый файл флага, если он локальный

    // DEPRECATED, keeping this for info
    // const old = await db().prepare('SELECT flag_link FROM states WHERE uuid=?').get(stateUuid) as { flag_link: string | null }
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT `flag_link` FROM `states` WHERE `uuid` = ?',
        [stateUuid]
    );
    const old = rows[0] as { flag_link: string | null } | undefined;

    if (old?.flag_link && !old.flag_link.startsWith('http')) {
        await fsp.rm(join(uploadDir, old.flag_link), { force: true });
        await removeEmptyDirs(flagsRoot);
    }

    // Загружаем новый флаг
    let newLink: string;
    if (Buffer.isBuffer(flag)) {
        newLink = await flagToUploads(flag);
    } else {
        const isLocal = flag.startsWith('/');
        const isRemote = flag.startsWith('http://') || flag.startsWith('https://');
        if ((!isLocal && !isRemote) || !flag.endsWith('.png')) {
            throw createError({
                statusCode: 422,
                statusMessage: 'Invalid flag link',
                data: { statusMessageRu: 'Неверная ссылка на флаг' }
            });
        }
        newLink = flag;
    }

    // Обновляем запись в БД

    // DEPRECATED, keeping this for info
    // const res = await db().prepare('UPDATE states SET flag_link=?, updated=? WHERE uuid=?')
    //     .run(newLink, Date.now(), stateUuid)

    const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE `states` SET `flag_link` = ?, `updated` = ? WHERE `uuid` = ?',
        [newLink, Date.now(), stateUuid]
    );

    if (result.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update flag',
            data: { statusMessageRu: 'Не удалось обновить флаг' }
        });
    }

    return newLink;
}




export async function getStateByName(name: string): Promise<IState | null> {
    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const sql = db().prepare('SELECT * FROM states WHERE LOWER(name) = ?')
    // const state = await sql.get(name.toLowerCase()) as IState | undefined

    const sql = 'SELECT * FROM `states` WHERE LOWER(`name`) = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [name.toLowerCase()]);
    const state = rows[0] as IState | undefined;

    if (!state) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        });
    }

    state.flag_link = transformFlagLink(state.flag_link);

    return state;
}


export async function getStateByUuid(uuid: string): Promise<IState | null> {
    const pool = useMySQL('states');

    // DEPRECATED, keeping this for info
    // const sql = db().prepare('SELECT * FROM states WHERE uuid = ?')
    // const state = await sql.get(uuid) as IState | undefined

    const sql = 'SELECT * FROM `states` WHERE `uuid` = ?';
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [uuid]);
    const state = rows[0] as IState | undefined;

    if (!state) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        });
    }

    state.flag_link = transformFlagLink(state.flag_link);

    return state;
}


export async function declareNewState(
    name: string,
    description: string,
    color: string,
    govForm: GovernmentForm = GovernmentForm.TRIBAL,
    hasElections: boolean = false,
    telegramLink: string | null = null,
    creatorUuid: string,
    rulerUuid: string = creatorUuid,
    allowDualCitizenship: boolean = false,
    freeEntry: boolean = true,
    freeEntryDescription: string | null = null,
    flag: Buffer | string = '/defaults/flags/default.png',
): Promise<string> {

    await assertState(name, true)
    assertColor(color)

    let flagLink: string | null = null
    if (typeof flag === 'string') {
        const isLocal = flag.startsWith('/')
        const isRemote = flag.startsWith('http://') || flag.startsWith('https://')
        if ((!isLocal && !isRemote) || !flag.endsWith('.png')) {
            throw createError({ statusCode: 422, statusMessage: 'Invalid flag link', data: { statusMessageRu: 'Неверная ссылка на флаг' } })
        }
        flagLink = flag
    } else if (Buffer.isBuffer(flag)) {
        flagLink = await flagToUploads(flag)
    } else {
        throw createError({
            statusCode: 422,
            statusMessage: 'Invalid flag type',
            data: { statusMessageRu: 'Неверный тип флага' }
        })
    }

    if (await isPlayerRulerSomewhere(rulerUuid)){
        throw createError({
            statusCode: 422,
            statusMessage: 'Player is already a ruler in another state',
            data: { statusMessageRu: 'Игрок уже является правителем в другом государстве' }
        })
    }

    if (!allowDualCitizenship) {
        if (await isPlayerInAnyState(rulerUuid)) {
            throw createError({
                statusCode: 422,
                statusMessage: 'Player already has citizenship in another state',
                data: { statusMessageRu: 'Игрок уже имеет гражданство в другом государстве' }
            })
        }
    }

    if (typeof telegramLink === 'string') {
        const ok = telegramLink.startsWith('https://t.me/')
            || telegramLink.startsWith('https://telegram.me/')
            || telegramLink.startsWith('http://t.me/')
            || telegramLink.startsWith('t.me/')
            || telegramLink.startsWith('@')
        if (!ok) {
            throw createError({ statusCode: 422, statusMessage: 'Invalid telegram link', data: { statusMessageRu: 'Неверная ссылка на Telegram' } })
        }
    }

    const pool = useMySQL('states')

    const uuid = uuidv4()
    const now = Date.now()

    // DEPRECATED:
    // const sql = db().prepare(`
    //     INSERT INTO states (...) VALUES (?, ?, ..., ?)
    // `)
    // const req = await sql.run(...)

    const stateSql = `
        INSERT INTO states (
            uuid, name, description, color_hex, gov_form, has_elections,
            telegram_link, creator_uuid, ruler_uuid, allow_dual_citizenship,
            free_entry, free_entry_description, status, flag_link, created, updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    const stateValues = [
        uuid, name, description, color, govForm, hasElections,
        telegramLink, creatorUuid, rulerUuid, allowDualCitizenship,
        freeEntry, freeEntryDescription, StateStatus.PENDING, flagLink, now, now
    ]

    const [stateRes] = await pool.execute<ResultSetHeader>(stateSql, stateValues)
    if (stateRes.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to declare new state',
            data: { statusMessageRu: 'Не удалось создать новое государство' }
        })
    }

    const memberUuid = uuidv4()

    // DEPRECATED:
    // const memberSql = db().prepare(`
    //     INSERT INTO state_members (...) VALUES (?, ?, ..., ?)
    // `)
    // const memberReq = await memberSql.run(...)

    const memberSql = `
        INSERT INTO state_members (uuid, created, updated, state_uuid, city_uuid, player_uuid, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)`
    const memberValues = [
        memberUuid, now, now, uuid, null, rulerUuid, RolesInState.RULER
    ]

    const [memberRes] = await pool.execute<ResultSetHeader>(memberSql, memberValues)
    if (memberRes.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create initial ruler member',
            data: { statusMessageRu: 'Не удалось создать начального правителя' }
        })
    }

    const historyEvent: IHistoryEvent = {
        uuid: uuidv4(),
        created: now,
        updated: now,
        type: HistoryEventType.STATE_CREATED,
        title: "Создано новое государство",
        description: `Государство "${name}" было создано.`,
        state_uuids: [uuid],
        player_uuids: [creatorUuid],
        alliance_uuids: null,
        war_uuid: null,
        city_uuids: null,
        details_json: null,
        created_by_uuid: creatorUuid,
        season: null,
        is_deleted: false,
        deleted_at: null,
        deleted_by_uuid: null
    }

    await addHistoryEvent(historyEvent)
    return uuid
}




/**
 * Вспомогательная функция для преобразования flag_link.
 * Добавляет префикс /distant-api/ к локальным ссылкам.
 * @param flagLink - Ссылка на флаг.
 * @returns {string | null} Преобразованная ссылка на флаг или null.
 */
function transformFlagLink(flagLink: string | null): string | null {
    if (!flagLink) {
        return null;
    }
    // Не изменяем абсолютные URL-адреса
    if (flagLink.startsWith('http://') || flagLink.startsWith('https://')) {
        return flagLink;
    }

    const prefix = "/distant-api";

    // Если ссылка уже начинается со слеша (например, /defaults/flag.png)
    if (flagLink.startsWith('/')) {
        return prefix + flagLink; // результат: /distant-api/defaults/flag.png
    } else {
        // Для относительных путей (например, flags/hash.png)
        return prefix + '/' + flagLink; // результат: /distant-api/flags/hash.png
    }
}

export type StateFilter = Partial<{
    search: string
    name: string
    description: string
    colorHex: string
    govForm: IState['gov_form']
    hasElections: boolean
    status: IState['status']
    capitalUuid: string
    mapLink: string | null
    telegramLink: string | null
    creatorUuid: string
    rulerUuid: string
    allowDualCitizenship: boolean
    freeEntry: boolean
    freeEntryDescription: string | null
    flagLink: string
}>

export async function editState(
    state: Partial<IState>,
): Promise<boolean> {

    if (!state.uuid) {
        throw createError({ statusCode: 422, statusMessage: 'Missing uuid', data: { statusMessageRu: 'Отсутствует uuid' } })
    }

    if (state.name) await assertState(state.name, true)
    if (state.color_hex) assertColor(state.color_hex)

    let flagLink: string | null = null
    if (state.flag_link) {
        if (typeof state.flag_link === 'string') {
            const isLocal = state.flag_link.startsWith('/')
            const isRemote = state.flag_link.startsWith('http://') || state.flag_link.startsWith('https://')
            if ((!isLocal && !isRemote) || !state.flag_link.endsWith('.png')) {
                throw createError({ statusCode: 422, statusMessage: 'Invalid flag link', data: { statusMessageRu: 'Неверная ссылка на флаг' } })
            }
            flagLink = state.flag_link
        } else if (Buffer.isBuffer(state.flag_link)) {
            // If flag is a Buffer, convert it to uploads
            flagLink = await flagToUploads(state.flag_link)
        } else {
            throw createError({
                statusCode: 422,
                statusMessage: 'Invalid flag type',
                data: { statusMessageRu: 'Неверный тип флага' }
            })
        }
    } else {
        flagLink = null
    }

    if (state.telegram_link) {
        if (typeof state.telegram_link === 'string') {
            const ok = state.telegram_link.startsWith('https://t.me/')
                || state.telegram_link.startsWith('https://telegram.me/')
                || state.telegram_link.startsWith('http://t.me/')
                || state.telegram_link.startsWith('t.me/')
                || state.telegram_link.startsWith('@')
            if (!ok) {
                throw createError({ statusCode: 422, statusMessage: 'Invalid telegram link', data: { statusMessageRu: 'Неверная ссылка на Telegram' } })
            }
        }
    }

    const pool = useMySQL('states')

    const clauses: string[] = []
    const values: any[] = []

    // Собираем SET-часть динамически, исключая служебные поля
    for (const [key, value] of Object.entries(state)) {
        if (value !== undefined && key !== 'uuid' && key !== 'created' && key !== 'updated') {
            if (key === 'flag_link') {
                // Используем рассчитанный flagLink (string|null), а не сырое значение
                clauses.push('flag_link = ?')
                values.push(flagLink)
            } else {
                clauses.push(`${key} = ?`)
                values.push(value)
            }
        }
    }

    // Обновляем updated всегда
    clauses.push('updated = ?')
    values.push(Date.now())

    // uuid в WHERE
    values.push(state.uuid)

    const sql = `UPDATE states SET ${clauses.join(', ')} WHERE uuid = ?`

    try {
        const [res] = await pool.execute<ResultSetHeader>(sql, values)
        if ((res as ResultSetHeader).affectedRows === 0) {
            throw createError({ statusCode: 404, statusMessage: 'State not found', data: { statusMessageRu: 'Государство не найдено' } })
        }
    } catch (error) {
        throw createError({ statusCode: 500, statusMessage: 'Error occurred when requesting database. S-U:524', data: { statusMessageRu: 'Внутренняя ошибка S-U:524'} })
    }

    return true
}


/**
 * Поиск государств с фильтрами и пагинацией.
 * @param filters — объект фильтров (ключи из IState → значения).
 * @param startAt — смещение (OFFSET), опционально.
 * @param limit — максимальное число записей (LIMIT), опционально.
 */
export async function searchStatesByFilters(
    filters: StateFilter,
    startAt?: number,
    limit?: number
): Promise<IState[]> {
    const pool = useMySQL('states') // Заменено: useDatabase → useMySQL

    const columnMap: Record<keyof StateFilter, string> = {
        search:                   'name',
        name:                     'name',
        description:              'description',
        colorHex:                 'color_hex',
        govForm:                  'gov_form',
        hasElections:             'has_elections',
        status:                   'status',
        capitalUuid:              'capital_uuid',
        mapLink:                  'map_link',
        telegramLink:             'telegram_link',
        creatorUuid:              'creator_uuid',
        rulerUuid:                'ruler_uuid',
        allowDualCitizenship:     'allow_dual_citizenship',
        freeEntry:                'free_entry',
        freeEntryDescription:     'free_entry_description',
        flagLink:                 'flag_link',
    }

    const clauses: string[] = []
    const values: any[] = []

    for (const [key, rawValue] of Object.entries(filters) as [keyof StateFilter, any][]) {
        if (rawValue == null || !(key in columnMap)) continue

        const col = columnMap[key]
        if (typeof rawValue === 'string') {
            clauses.push(`${col} LIKE ?`)
            values.push(`%${rawValue}%`)
        } else {
            clauses.push(`${col} = ?`)
            values.push(rawValue)
        }
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

    let paginationSQL = ''
    if (typeof limit === 'number') {
        paginationSQL += ` LIMIT ?`
        values.push(limit)
        if (typeof startAt === 'number') {
            paginationSQL += ` OFFSET ?`
            values.push(startAt)
        }
    } else if (typeof startAt === 'number') {
        paginationSQL += ` LIMIT 10 OFFSET ?`
        values.push(startAt)
    }

    // DEPRECATED:
    // const db = useDatabase('states')
    // const sql = db.prepare(`SELECT * FROM states ${where}${paginationSQL}`)
    // const rows = await (values.length ? sql.all(...values) : sql.all()) as IState[]

    const finalSql = `SELECT * FROM states ${where}${paginationSQL}`
    const [rows] = await pool.execute<RowDataPacket[]>(finalSql, values)
    const states = rows as IState[]

    if (!states || states.length === 0) {
        return []
    }

    for (const state of states) {
        state.flag_link = transformFlagLink(state.flag_link)
    }

    return states
}


export async function listStates(startAt = 0, limit = 100): Promise<IState[]> {
    return searchStatesByFilters({}, startAt, limit)
}

export async function listSomeStates(amount = 1): Promise<IState[]> {
    const pool = useMySQL('states');

    const sql = `SELECT * FROM states ORDER BY RAND() LIMIT ${amount};`;
    const [rows] = await pool.execute<RowDataPacket[]>(sql);
    const states = rows as IState[];

    if (!states || states.length === 0) {
        return [];
    }

    for (const state of states) {
        state.flag_link = transformFlagLink(state.flag_link);
    }

    return states;
}




export async function getStateMembers(stateUuid: string): Promise<IStateMember[]> {
    const pool = useMySQL('states')

    // DEPRECATED:
    // const sql = db().prepare('SELECT * FROM state_members WHERE state_uuid = ?')
    // const members = await sql.all(stateUuid) as IStateMember[]

    const sql = 'SELECT * FROM state_members WHERE state_uuid = ?'
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [stateUuid])
    const members = rows as IStateMember[]

    if (!members || members.length === 0) {
        throw createError({
            statusCode: 404,
            statusMessage: 'No members found for this state',
            data: { statusMessageRu: 'У этого государства нет участников' }
        })
    }

    return members
}


export async function approveState(stateUuid: string, adminUuid: string): Promise<void> {
    if (!await isUserAdmin(adminUuid)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
            data: { statusMessageRu: 'Недостаточно прав' }
        })
    }
    try {
        await getStateByUuid(stateUuid)
    } catch (e) {
        throw e;
    }

    const pool = useMySQL('states')

    // DEPRECATED:
    // const sql = db().prepare('UPDATE states SET status = ?, updated = ? WHERE uuid = ?')
    // const req = await sql.run(StateStatus.ACTIVE, Date.now(), stateUuid)

    const sql = 'UPDATE states SET status = ?, updated = ? WHERE uuid = ?'
    const [result] = await pool.execute<ResultSetHeader>(sql, [StateStatus.ACTIVE, Date.now(), stateUuid])

    if (result.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to approve state',
            data: { statusMessageRu: 'Не удалось одобрить государство' }
        })
    }

    const historyEvent: IHistoryEvent = {
        uuid: uuidv4(),
        created: Date.now(),
        updated: Date.now(),
        type: HistoryEventType.STATE_STATUS_CHANGED,
        title: "Одобрено новое государство",
        description: `Государство было создано.`,
        state_uuids: [stateUuid],
        player_uuids: null,
        alliance_uuids: null,
        war_uuid: null,
        city_uuids: null,
        details_json: null,
        created_by_uuid: adminUuid,
        season: null,
        is_deleted: false,
        deleted_at: null,
        deleted_by_uuid: null
    }

    addHistoryEvent(historyEvent)
    return;
}



export async function rejectState(stateUuid: string, adminUuid: string): Promise<void> {
    if (!await isUserAdmin(adminUuid)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
            data: { statusMessageRu: 'Недостаточно прав' }
        })
    }
    try {
        await getStateByUuid(stateUuid)
    } catch (e) {
        throw e;
    }

    const pool = useMySQL('states')

    // DEPRECATED:
    // const sql = db().prepare('UPDATE states SET status = ?, updated = ? WHERE uuid = ?')
    // const req = await sql.run(StateStatus.REJECTED, Date.now(), stateUuid)

    const sql = 'UPDATE states SET status = ?, updated = ? WHERE uuid = ?'
    const [res] = await pool.execute<ResultSetHeader>(sql, [StateStatus.REJECTED, Date.now(), stateUuid])

    if (res.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to reject state',
            data: { statusMessageRu: 'Не удалось отклонить государство' }
        })
    }

    const historyEvent: IHistoryEvent = {
        uuid: uuidv4(),
        created: Date.now(),
        updated: Date.now(),
        type: HistoryEventType.STATE_STATUS_CHANGED,
        title: "Отклонено новое государство",
        description: `Создание государства отменено.`,
        state_uuids: [stateUuid],
        player_uuids: null,
        alliance_uuids: null,
        war_uuid: null,
        city_uuids: null,
        details_json: null,
        created_by_uuid: adminUuid,
        season: null,
        is_deleted: false,
        deleted_at: null,
        deleted_by_uuid: null
    }

    addHistoryEvent(historyEvent)
    return;
}


export async function deleteState(stateUuid: string, adminUuid: string): Promise<void> {
    if (!await isUserAdmin(adminUuid)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
            data: { statusMessageRu: 'Недостаточно прав' }
        })
    }

    const state = await getStateByUuid(stateUuid)

    if (state.flag_link && !state.flag_link.startsWith('http')) {
        const { uploadDir = './uploads' } = useRuntimeConfig()
        const flagsRoot = join(uploadDir, 'flags')
        await fsp.rm(join(uploadDir, state.flag_link), { force: true })
        await removeEmptyDirs(flagsRoot)
    }

    const pool = useMySQL('states')

    // DEPRECATED:
    // const del1 = await db().prepare('DELETE FROM states WHERE uuid=?').run(stateUuid)
    const sql1 = 'DELETE FROM states WHERE uuid = ?'
    const [res1] = await pool.execute<ResultSetHeader>(sql1, [stateUuid])

    if (res1.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete state',
            data: { statusMessageRu: 'Не удалось удалить государство' }
        })
    }

    // DEPRECATED:
    // const del2 = await db().prepare(`
    // DELETE FROM history_events
    // WHERE JSON_LENGTH(state_uuids)=1
    //   AND JSON_UNQUOTE(JSON_EXTRACT(state_uuids,'$[0]'))=?
    // `).run(stateUuid)

    const sql2 = `
        DELETE FROM history_events
        WHERE JSON_LENGTH(state_uuids) = 1
          AND JSON_UNQUOTE(JSON_EXTRACT(state_uuids, '$[0]')) = ?`
    const [res2] = await pool.execute<ResultSetHeader>(sql2, [stateUuid])

    if (res2.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete history events',
            data: { statusMessageRu: 'Не удалось удалить события истории' }
        })
    }

    return
}


export async function denonceState(stateUuid: string, playerUuid: string): Promise<void> {
    if (
        !await isUserAdmin(playerUuid) &&
        !(await isPlayerInState(playerUuid, stateUuid) &&
            await getStateMemberRole(stateUuid, playerUuid) === RolesInState.RULER)
    ) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
            data: { statusMessageRu: 'Недостаточно прав' }
        })
    }

    try {
        await getStateByUuid(stateUuid)
    } catch (e) {
        throw e
    }

    const pool = useMySQL('states')

    // DEPRECATED:
    // const sql = db().prepare('UPDATE states SET status = ?, updated = ? WHERE uuid = ?')
    // const req = await sql.run(StateStatus.DISSOLVED, Date.now(), stateUuid)

    const sql = 'UPDATE states SET status = ?, updated = ? WHERE uuid = ?'
    const [res] = await pool.execute<ResultSetHeader>(sql, [StateStatus.DISSOLVED, Date.now(), stateUuid])

    if (res.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to denounce state',
            data: { statusMessageRu: 'Не удалось денонсировать государство' }
        })
    } else {
        const historyEvent: IHistoryEvent = {
            uuid: uuidv4(),
            created: Date.now(),
            updated: Date.now(),
            type: HistoryEventType.STATE_STATUS_CHANGED,
            title: "Денонсировано государство",
            description: `Государство было денонсировано.`,
            state_uuids: [stateUuid],
            player_uuids: [playerUuid],
            alliance_uuids: null,
            war_uuid: null,
            city_uuids: null,
            details_json: null,
            created_by_uuid: playerUuid,
            season: null,
            is_deleted: false,
            deleted_at: null,
            deleted_by_uuid: null
        }
        await addHistoryEvent(historyEvent)
    }

    return
}


export async function reanonceState(stateUuid: string, playerUuid: string): Promise<void> {
    if (
        !await isUserAdmin(playerUuid) &&
        !(await isPlayerInState(playerUuid, stateUuid) &&
            await getStateMemberRole(stateUuid, playerUuid) === RolesInState.RULER)
    ) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
            data: { statusMessageRu: 'Недостаточно прав' }
        })
    }

    try {
        await getStateByUuid(stateUuid)
    } catch (e) {
        throw e
    }

    const pool = useMySQL('states')

    // DEPRECATED:
    // const sql = db().prepare('UPDATE states SET status = ?, updated = ? WHERE uuid = ?')
    // const req = await sql.run(StateStatus.ACTIVE, Date.now(), stateUuid)

    const sql = 'UPDATE states SET status = ?, updated = ? WHERE uuid = ?'
    const [res] = await pool.execute<ResultSetHeader>(sql, [StateStatus.ACTIVE, Date.now(), stateUuid])

    if (res.affectedRows === 0) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to denounce state',
            data: { statusMessageRu: 'Не удалось денонсировать государство' }
        })
    } else {
        const historyEvent: IHistoryEvent = {
            uuid: uuidv4(),
            created: Date.now(),
            updated: Date.now(),
            type: HistoryEventType.STATE_STATUS_CHANGED,
            title: "Восстановлено государство",
            description: `Государство было восстановлено.`,
            state_uuids: [stateUuid],
            player_uuids: [playerUuid],
            alliance_uuids: null,
            war_uuid: null,
            city_uuids: null,
            details_json: null,
            created_by_uuid: playerUuid,
            season: null,
            is_deleted: false,
            deleted_at: null,
            deleted_by_uuid: null
        }
        await addHistoryEvent(historyEvent)
    }

    return
}



