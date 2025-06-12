// server/auth/session.get.ts
defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    description: 'Return session information',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    responses: {
      200: {
        description: 'Authenticated session',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                uuid: { type: 'string' },
                nickname: { type: 'string' }
              }
            }
          }
        }
      },
      401: { description: 'Unauthenticated' },
      404: { description: 'User not found' }
    }
  }
})
export default defineEventHandler(async (event) => {
    /* JWT уже проверен middleware ⇒ event.context.auth.uuid есть */
    const { uuid } = event.context.auth || {}

    if (!uuid) {
        /* если Bearer вовсе не был передан, nuxt-auth получит 401 и поймёт,
           что пользователь «гость» */
        throw createError({ statusCode: 401, statusMessage: 'Unauthenticated' })
    }

    /* найдём пользователя в БД и вернём public-данные */
    const user = await getUserByUUID(uuid)          // утилита из ваших utils
    return {
        uuid: user.UUID,
        nickname: user.NICKNAME
    }
})
