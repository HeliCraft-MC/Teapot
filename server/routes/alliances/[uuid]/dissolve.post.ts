defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Dissolve an alliance',
    parameters: [
      { in: 'path', name: 'uuid', required: true },
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      description: 'Initiator and state info',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              byPlayerUuid: { type: 'string' },
              stateUuid: { type: 'string', nullable: true }
            },
            required: ['byPlayerUuid']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Alliance dissolved',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      403: { description: 'Not authorized' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    const { byPlayerUuid, stateUuid } = await readBody(event)
    await dissolveAlliance(allianceUuid, byPlayerUuid, stateUuid)
    return { ok: true }
})
