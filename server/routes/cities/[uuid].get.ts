defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Get city information',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: { description: 'City data or null if not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    return await getCityByUuid(uuid)
})
