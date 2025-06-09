defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Attach a city to a state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'State UUID',
      required: true
    },
    responses: {
      200: {
        description: 'City attached',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      404: { description: 'State not found' },
      500: { description: 'Failed to attach city' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const cityUuid = getRouterParam(event, 'uuid')
    const { stateUuid } = await readBody(event)
    await attachCityToState(cityUuid, stateUuid)
    return { ok: true }
})
