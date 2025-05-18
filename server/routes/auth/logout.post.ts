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
        throw e
    }
})