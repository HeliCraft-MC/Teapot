import {H3Error} from "h3";

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    description: 'Logout current user',
    responses: {
      200: { description: 'Logout successful' }
    }
  }
})

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