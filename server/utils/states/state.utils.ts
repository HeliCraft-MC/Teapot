import {GovernmentForm, StateStatus, IStateMember, IState, RolesInState} from '../../../../HeliCraftFrontNuxtVesper/types/state.types'
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

const MAX_NAME_LEN = 32
const MIN_NAME_LEN = 3

const db = () => useDatabase('states')


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
        })
    }


    if (throwIfExists != undefined) {
        const sql = db().prepare('SELECT * FROM states WHERE LOWER(name) = ?')
        const existing = await sql.get(name.toLowerCase()) as IState | undefined

        if (existing) {
            if (throwIfExists == true) {
                throw createError({
                    statusCode: 409,
                    statusMessage: 'State with this name already exists',
                    data: { statusMessageRu: 'Государство с таким названием уже существует' }
                })
            } else {
                return true
            }
        }
        return false
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

export async function getStateByName(name: string): Promise<IState | null> {
    const sql = db().prepare('SELECT * FROM states WHERE LOWER(name) = ?')
    const state = await sql.get(name.toLowerCase()) as IState | undefined

    if (!state) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }

    state.flag_link = transformFlagLink(state.flag_link)

    return state
}

export async function getStateByUuid(uuid: string): Promise<IState | null> {
    const sql = db().prepare('SELECT * FROM states WHERE uuid = ?')
    const state = await sql.get(uuid) as IState | undefined

    if (!state) {
        throw createError({
            statusCode: 404,
            statusMessage: 'State not found',
            data: { statusMessageRu: 'Государство не найдено' }
        })
    }

    state.flag_link = transformFlagLink(state.flag_link)

    return state
}

/**
 * Declares a new state with the given parameters.
 * @param name - The name of the state.
 * @param description - A brief description of the state.
 * @param color - The color of the state in hex format (e.g., #RRGGBB).
 * @param govForm - The form of government for the state (default is GovernmentForm.TRIBAL).
 * @param hasElections - Whether the state has elections (default is false).
 * @param telegramLink - Optional link to the state's Telegram channel or group.
 * @param creatorUuid - The UUID of the user creating the state, used as the initial ruler.
 * @param rulerUuid - The UUID of the ruler of the state (default is the creator's UUID).
 * @param allowDualCitizenship - Whether the state allows multi citizenship (default is false).
 * @param freeEntry - Whether the state allows free entry (default is true).
 * @param freeEntryDescription - Optional description for free entry, if applicable.
 * @param flag - Link to the flag image or a Buffer containing the flag data (default is a placeholder image).
 */
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

    /* ---- Check if the state name is valid and does not already exist ---- */
    await assertState(name, true)
    assertColor(color)

    /* ---- Checks ---- */
    let flagLink: string | null = null
    if (typeof flag === 'string') {
        const isLocal = flag.startsWith('/')
        const isRemote = flag.startsWith('http://') || flag.startsWith('https://')
        if ((!isLocal && !isRemote) || !flag.endsWith('.png')) {
            throw createError({ statusCode: 422, statusMessage: 'Invalid flag link', data: { statusMessageRu: 'Неверная ссылка на флаг' } })
        }
        flagLink = flag
    } else if (Buffer.isBuffer(flag)) {
        // If flag is a Buffer, convert it to uploads
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

    /* ---- Insert the new state into the database ---- */
    const sql = db().prepare(`
        INSERT INTO states (
            uuid, name, description, color_hex, gov_form, has_elections,
            telegram_link, creator_uuid, ruler_uuid, allow_dual_citizenship,
            free_entry, free_entry_description, status, flag_link, created, updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

    const uuid = uuidv4()

    const req = await sql.run(
        uuid, name, description, color, govForm, hasElections,
        telegramLink, creatorUuid, rulerUuid, allowDualCitizenship,
        freeEntry, freeEntryDescription, StateStatus.PENDING , flagLink, Date.now(), Date.now())

    if (req.success == true) {
        // Create the initial ruler member
        const memberSql = db().prepare(`
            INSERT INTO state_members (uuid, created, updated, state_uuid, city_uuid, player_uuid, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)`)

        const memberReq = await memberSql.run(
            uuidv4(), Date.now(), Date.now(), uuid, null, rulerUuid, RolesInState.RULER
        )

        if (memberReq.success == true) {
            // Create the initial history event
            const historyEvent: IHistoryEvent = {
                uuid: uuidv4(),
                created: Date.now(),
                updated: Date.now(),
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
        } else {
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to create initial ruler member',
                data: { statusMessageRu: 'Не удалось создать начального правителя' }
            })
        }
    } else {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to declare new state',
            data: { statusMessageRu: 'Не удалось создать новое государство' }
        })
    }
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
    const db = useDatabase('states')

    const columnMap: Record<keyof StateFilter, string> = {
        search:                   'name', // Поиск по имени
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

    // Пагинация
    let paginationSQL = ''
    if (typeof limit === 'number') {
        paginationSQL += ` LIMIT ?`
        values.push(limit)
        if (typeof startAt === 'number') {
            paginationSQL += ` OFFSET ?`
            values.push(startAt)
        }
    } else if (typeof startAt === 'number') {
        // если передан только startAt, нужно задать какой-то limit — например, больший
        paginationSQL += ` LIMIT 10 OFFSET ?`
        values.push(startAt)
    }

    const sql = db.prepare(`SELECT * FROM states ${where}${paginationSQL}`)
    const rows = await (values.length
            ? sql.all(...values)
            : sql.all()
    ) as IState[]

    if (!rows || rows.length === 0) {
        return []
    }
    // Преобразуем ссылки на флаги
    for (const row of rows) {
        row.flag_link = transformFlagLink(row.flag_link)
    }
    return rows
}

export async function listStates(startAt = 0, limit = 100): Promise<IState[]> {
    return searchStatesByFilters({}, startAt, limit)
}




export async function getStateMembers(stateUuid: string): Promise<IStateMember[]> {
    const sql = db().prepare('SELECT * FROM state_members WHERE state_uuid = ?')
    const members = await sql.all(stateUuid) as IStateMember[]

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

    const sql = db().prepare('UPDATE states SET status = ?, updated = ? WHERE uuid = ?')
    const req = await sql.run(StateStatus.ACTIVE, Date.now(), stateUuid)

    if (!req.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to approve state',
            data: { statusMessageRu: 'Не удалось одобрить государство' }
        })
    }

    //create history event
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

    const sql = db().prepare('UPDATE states SET status = ?, updated = ? WHERE uuid = ?')
    const req = await sql.run(StateStatus.REJECTED, Date.now(), stateUuid)

    if (!req.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to reject state',
            data: { statusMessageRu: 'Не удалось отклонить государство' }
        })
    }

    //create history event
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
    try {
        await getStateByUuid(stateUuid)
    } catch (e) {
        throw e;
    }

    {
        const sql = db().prepare('DELETE FROM states WHERE uuid = ?')
        const req = await sql.run(stateUuid)

        if (!req.success) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to delete state',
                data: {statusMessageRu: 'Не удалось удалить государство'}
            })
        }
    }

    // remove all events from history where stateUuid is only one in state_uuids
    {
        const sql = db().prepare(`
      DELETE FROM history_events
      WHERE JSON_LENGTH(state_uuids) = 1
        AND JSON_UNQUOTE(JSON_EXTRACT(state_uuids, '$[0]')) = ?
    `)
        const req = await sql.run(stateUuid)

        if (!req.success) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to delete state',
                data: {statusMessageRu: 'Не удалось удалить государство'}
            })
        }
    }

    return
}

export async function denonceState(stateUuid: string, playerUuid: string): Promise<void> {
    if (!await isUserAdmin(playerUuid) || !(await isPlayerInState(playerUuid, stateUuid) && await getStateMemberRole(stateUuid, playerUuid) == RolesInState.RULER)) {
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

    const sql = db().prepare('UPDATE states SET status = ?, updated = ? WHERE uuid = ?')
    const req = await sql.run(StateStatus.DISSOLVED, Date.now(), stateUuid)

    if (!req.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to denounce state',
            data: { statusMessageRu: 'Не удалось денонсировать государство' }
        })
    } else {
        // create history event
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

    return;
}

export async function reanonceState(stateUuid: string, playerUuid: string): Promise<void>{
    if (!await isUserAdmin(playerUuid) && !(await isPlayerInState(playerUuid, stateUuid) && await getStateMemberRole(stateUuid, playerUuid) == RolesInState.RULER)) {
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

    const sql = db().prepare('UPDATE states SET status = ?, updated = ? WHERE uuid = ?')
    const req = await sql.run(StateStatus.DISSOLVED, Date.now(), stateUuid)

    if (!req.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to denounce state',
            data: { statusMessageRu: 'Не удалось денонсировать государство' }
        })
    } else {
        // create history event
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

    return;
}


