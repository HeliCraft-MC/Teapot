defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Update role of a state member',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Player and updater uuids with new role',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              playerUuid: { type: 'string' },
              updaterUuid: { type: 'string' },
              newRole: { type: 'string' }
            },
            required: ['playerUuid', 'updaterUuid', 'newRole']
          }
        }
      }
    },
      responses: {
        200: {
          description: 'Role updated',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { ok: { type: 'boolean' } } }
            }
          }
        },
        400: { description: 'Invalid request or cannot change own role' },
        403: { description: 'Insufficient permissions' },
        404: { description: 'State or member not found' }
      }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const { playerUuid, updaterUuid, newRole } = await readBody(event)
    await updateMemberRole(stateUuid, playerUuid, updaterUuid, newRole)
    return { ok: true }
})
