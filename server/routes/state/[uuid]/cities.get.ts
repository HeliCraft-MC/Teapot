defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'List cities of a state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: { description: 'List of cities' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    return await getCitiesByStateUuid(stateUuid)
})
