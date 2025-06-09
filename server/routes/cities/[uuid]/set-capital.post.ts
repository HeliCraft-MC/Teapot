defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Mark a city as the capital of its state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: {
        description: 'Capital changed',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      400: { description: 'City has no state' },
      500: { description: 'Failed to update capital' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const cityUuid = getRouterParam(event, 'uuid')
    await setCityAsCapital(cityUuid)
    return { ok: true }
})
