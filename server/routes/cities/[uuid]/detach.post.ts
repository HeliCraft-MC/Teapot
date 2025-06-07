defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Detach a city from its state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: { description: 'City detached' },
      400: { description: 'Cannot detach capital city' },
      500: { description: 'Failed to detach city' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const cityUuid = getRouterParam(event, 'uuid')
    await detachCityFromState(cityUuid)
    return { ok: true }
})
