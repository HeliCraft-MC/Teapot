import bcrypt from 'bcrypt'
import { AuthUser } from '~/interfaces/mysql.types'


/**
 * Logs in a user by validating the provided nickname and password.
 * Throws an error if the user is not found or the password is incorrect.
 *
 * @param {string} nickname - The nickname of the user attempting to log in.
 * @param {string} password - The plain-text password provided by the user.
 * @return {Promise<{ tokens: object, uuid: string, nickname: string }>} A promise that resolves to an object containing the user's tokens, UUID, and nickname.
 * @throws {Error} Throws an error if the user is not found or the password is incorrect.
 */
export async function loginUser(nickname: string, password: string) {
    const db = useDatabase()
    const req = db.prepare('SELECT * FROM AUTH WHERE LOWERCASENICKNAME = ?')
    const user = await req.get(nickname.toLowerCase()) as AuthUser

    if (!user || !user.HASH || !user.NICKNAME || !user.UUID) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
            data: {
                statusMessageRu: 'Пользователь не найден',
            }
        })
    }

    if (!(await bcrypt.compare(password, user.HASH))) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid password',
            data: {
                statusMessageRu: 'Неверный пароль',
            }
        })
    }

    const tokens = generateTokens(user)

    return { tokens, uuid: user.UUID, nickname: user.NICKNAME }
}

/**
 * Refreshes the user data by validating the provided refresh token and regenerating tokens if valid.
 *
 * @param {string} uuid - The unique identifier of the user.
 * @param {string} refreshToken - The refresh token to be validated for the user.
 * @return {Promise<{tokens: object, uuid: string, nickname: string}>} A promise that resolves with the regenerated tokens, user's UUID, and nickname if the refresh token is valid.
 * @throws {Error} Throws an error if the user is not found or if the refresh token is invalid.
 */
export async function refreshUser(uuid: string, refreshToken: string) {
    const db = useDatabase()
    const req = db.prepare('SELECT * FROM AUTH WHERE UUID = ? OR UUID_WR = ?')
    const user = await req.get(uuid, uuid) as AuthUser

    if (!user || !user.HASH || !user.NICKNAME || !user.UUID) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
            data: {
                statusMessageRu: 'Пользователь не найден',
            }
        })
    }
    if(verifyTokenWithCredentials(refreshToken, user)) {
        const tokens = generateTokens(user)
        return { tokens, uuid: user.UUID, nickname: user.NICKNAME }
    } else {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid refresh token',
            data: {
                statusMessageRu: 'Неверный токен обновления',
            }
        })
    }
}

export async function checkAuth(uuid: string, accessToken: string) {
    const db = useDatabase()
    const req = db.prepare('SELECT * FROM AUTH WHERE UUID = ? OR UUID_WR = ?')
    const user = await req.get(uuid, uuid) as AuthUser

    if (!user || !user.HASH || !user.NICKNAME || !user.UUID) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Not authorized',
            data: {
                statusMessageRu: 'Не авторизован',
            }
        })
    }
    if(verifyTokenWithCredentials(accessToken, user)) {
        return true
    } else {
        throw createError({
            statusCode: 401,
            statusMessage: 'Not authorized',
            data: {
                statusMessageRu: 'Не авторизован',
            }
        })
    }
}