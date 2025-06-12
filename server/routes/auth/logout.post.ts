import {H3Error} from "h3";

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    description: 'Logout current user',
    parameters: [
      { in: 'cookie', name: 'refreshToken', required: false, schema: { type: 'string' } }
    ],
    responses: {
      200: {
        description: 'Logout successful',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                statusMessage: { type: 'string' },
                data: {
                  type: 'object',
                  properties: {
                    statusMessageRu: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
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