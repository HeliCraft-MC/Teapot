import bcrypt from 'bcrypt'
import { AuthUser } from '~/interfaces/mysql.types'


/**
 * Checks user password and generate tokens
 * 
 * @param nickname : string
 * @param password : string
 */
export async function loginUser(nickname: string, password: string) {
    const db = useDatabase()
    const req = db.prepare('SELECT * FROM AUTH WHERE LOWERCASENICKNAME = ?')
    const user = await req.get(nickname) as AuthUser

    if (!user || !user.HASH || !user.NICKNAME || !user.UUID_WR) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
            data: {
                statusMessageRu: 'Пользователь не найден',
            }
        })
    }

    if (!bcrypt.compareSync(password, user.HASH)) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid password',
            data: {
                statusMessageRu: 'Неверный пароль',
            }
        })
    }

    const tokens = generateTokens(user)

    return { tokens, uuid: user.UUID_WR, nickname: user.NICKNAME }
}

/**
 * Refresh user tokens
 *
 * @param nickname : string
 * @param refreshToken : string
 */
export async function refreshUser(nickname: string, refreshToken: string) {
    const db = useDatabase()
    const req = db.prepare('SELECT * FROM AUTH WHERE LOWERCASENICKNAME = ?')
    const user = await req.get(nickname) as AuthUser

    if (!user || !user.HASH || !user.NICKNAME || !user.UUID_WR) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
            data: {
                statusMessageRu: 'Пользователь не найден',
            }
        })
    }
    if(verifyToken(refreshToken)) {
        const tokens = generateTokens(user)
        return { tokens, uuid: user.UUID_WR, nickname: user.NICKNAME }
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