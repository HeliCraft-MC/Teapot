defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Send a request for a state to join an alliance',
    parameters: [
      { in: 'path', name: 'uuid', required: true },
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
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
        description: 'Join request created',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      400: { description: 'Already member or request pending' },
      403: { description: 'Not authorized' },
      404: { description: 'Alliance or state not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    const { stateUuid, playerUuid } = await readBody(event)
    await requestAllianceJoin(allianceUuid, stateUuid, playerUuid)
    return { ok: true }
})
