defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Detach a player from a city',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Player UUID',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { playerUuid: { type: 'string' } },
            required: ['playerUuid']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Player detached',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      500: { description: 'Failed to detach player' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const cityUuid = getRouterParam(event, 'uuid')
    const { playerUuid } = await readBody(event)
    await detachPlayerFromCity(playerUuid)
    return { ok: true }
})
