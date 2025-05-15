import {H3Error} from "h3";

export default defineEventHandler(async (event) => {
    const { nickname, password } = await readBody(event)

    try {
        const { tokens, uuid, nickname: userNickname } = await loginUser(nickname, password)
        setCookie(event, 'refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure:   true,
            sameSite: 'lax',
            maxAge:   7 * 24 * 60 * 60
        })
        return {
            uuid,
            nickname: userNickname
        }
    } catch (e) {
        if (e instanceof H3Error) {
            throw e
        } else {
            throw createError({
                statusCode: 500,
                statusMessage: 'Server error',
                data: {
                    statusMessageRu: 'Ошибка сервера',
                    error: e
                }
            })
        }
    }


})