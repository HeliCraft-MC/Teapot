defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Leave an alliance',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'State and player UUIDs',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              stateUuid: { type: 'string' },
              playerUuid: { type: 'string' }
            },
            required: ['stateUuid', 'playerUuid']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Left alliance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      403: { description: 'Not authorized' },
      404: { description: 'Membership not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    const { stateUuid, playerUuid } = await readBody(event)
    await leaveAlliance(allianceUuid, stateUuid, playerUuid)
    return { ok: true }
})
