import { changeUserNickname, isUserAdmin } from '~/utils/user.utils'

defineRouteMeta({
  openAPI: {
    tags: ['user'],
    description: 'Change user nickname',
    parameters: [
      { in: 'path', name: 'uuid', required: true },
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      description: 'New nickname',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              nickname: { type: 'string' }
            },
            required: ['nickname']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Nickname changed',
        content: {
          'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } }
        }
      },
      401: { description: 'Unauthenticated' },
      403: { description: 'Forbidden' },
      404: { description: 'User not found' },
      409: { description: 'Nickname already taken' },
      422: { description: 'Nickname is too short' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const targetUuid = getRouterParam(event, 'uuid')
  const { uuid: authUuid } = event.context.auth || {}

  if (!authUuid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthenticated' })
  }

  if (authUuid !== targetUuid && !(await isUserAdmin(authUuid))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { nickname } = await readBody(event)
  await changeUserNickname(targetUuid, nickname)
  return { ok: true }
})
