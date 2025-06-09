defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Attach a player to a city',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Player UUID',
      required: true
    },
    responses: {
      200: {
        description: 'Player attached',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      400: { description: 'Invalid state or player' },
      404: { description: 'City not found' },
      500: { description: 'Failed to attach player' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const cityUuid = getRouterParam(event, 'uuid')
    const { playerUuid } = await readBody(event)
    await attachPlayerToCity(playerUuid, cityUuid)
    return { ok: true }
})
