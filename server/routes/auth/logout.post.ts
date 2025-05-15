import {H3Error} from "h3";

export default defineEventHandler(async (event) => {
    try {
        deleteCookie(event, 'refreshToken')
        return {
            statusMessage: 'Logout successful',
            data: {
                statusMessageRu: 'Вы вышли из системы'
            }
        }
    } catch (e) {
        if (e instanceof H3Error){
            throw e
        } else throw createError({
            statusCode: 500,
            statusMessage: 'Logout failed',
            data: {
                statusMessageRu: 'Ошибка выхода из системы',
                error: e
            }
        })
    }
})