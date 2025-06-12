import { changeUserPassword, isUserAdmin } from '~/utils/user.utils'

defineRouteMeta({
  openAPI: {
    tags: ['user'],
    description: 'Change user password',
    parameters: [
      { in: 'path', name: 'uuid', required: true },
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      description: 'Old and new password',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              oldPassword: { type: 'string' },
              newPassword: { type: 'string' }
            },
            required: ['oldPassword', 'newPassword']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Password changed',
        content: {
          'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } }
        }
      },
      401: { description: 'Unauthenticated or invalid password' },
      403: { description: 'Forbidden' },
      404: { description: 'User not found' },
      422: { description: 'Password is too short' }
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

  const { oldPassword, newPassword } = await readBody(event)
  await changeUserPassword(targetUuid, oldPassword, newPassword)
  return { ok: true }
})
