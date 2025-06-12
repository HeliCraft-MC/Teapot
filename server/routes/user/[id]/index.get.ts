import {H3Error} from "h3";

defineRouteMeta({
  openAPI: {
    tags: ['user'],
    description: 'Get public user info',
    parameters: [
      { in: 'path', name: 'id', required: true }
    ],
    responses: {
      200: {
        description: 'User data',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                uuid: { type: 'string' },
                nickname: { type: 'string' },
                regDate: { type: 'number' },
                loginDate: { type: 'number' }
              }
            }
          }
        }
      },
      400: { description: 'Invalid id' },
      404: { description: 'User not found' }
    }
  }
})

/**
 * GET /user/[id]
 * Возвращает публичные поля пользователя: uuid, nickname, regDate, loginDate.
 * Параметр [id] может быть либо UUID, либо никнеймом (регистр не учитывается).
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const uuid = await resolveUuid(id)
    const user = await getUserByUUID(uuid)
    if (!user) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
            data: { statusMessageRu: 'Пользователь не найден' }
        })
    }
    // Возвращаем только публичные поля
    return toPublicUser(user)
})
