import {GovernmentForm, StateStatus, IStateMember, IState} from '~/interfaces/state/state.types'
import { v4 as uuidv4 } from 'uuid'
import { promises as fsp } from 'node:fs'
import { join, dirname } from 'pathe'
import sharp from 'sharp'

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
        // If flag is a string, it should be a link to an image
        if ((!flag.startsWith('/') || !flag.startsWith('http')) && !flag.endsWith('.png')) {
            throw createError({
                statusCode: 422,
                statusMessage: 'Invalid flag link',
                data: { statusMessageRu: 'Неверная ссылка на флаг' }
            })
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

    // TODO check if the rulerUuid is not already a ruler of another state

    if (!allowDualCitizenship) {
        // TODO check if the rulerUuid is not already a member of another state
    }

    if (typeof telegramLink === 'string' &&
        (!telegramLink.startsWith('https://t.me/') ||
            !telegramLink.startsWith('https://telegram.me/') ||
            !telegramLink.startsWith('@') ||
            !telegramLink.startsWith('http://t.me/')
            || !telegramLink.startsWith('t.me/')))
    {
        throw createError({
            statusCode: 422,
            statusMessage: 'Invalid telegram link',
        })
    }

    /* ---- Insert the new state into the database ---- */
    const sql = db().prepare(`
        INSERT INTO states (
            uuid, name, description, color, gov_form, has_elections,
            telegram_link, ruler_uuid, allow_dual_citizenship,
            free_entry, free_entry_description, flag, created, updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

    const uuid = uuidv4()

    const req = await sql.run(
        uuid, name, description, color, govForm, hasElections,
        telegramLink, rulerUuid, allowDualCitizenship,
        freeEntry, freeEntryDescription, flagLink, Date.now(), Date.now())

    if (req.success == true) {
        // Create the initial ruler member
        const memberSql = db().prepare(`
            INSERT INTO state_members (stateUuid, cityUuid, playerUuid, role, uuid, created, updated)
            VALUES (?, ?, ?, ?, ?, ?, ?)`)

        const memberReq = await memberSql.run(
            uuid, null, rulerUuid, 'RULER', uuidv4(), Date.now(), Date.now()
        )

        if (memberReq.success == true) {
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

