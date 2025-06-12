defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Get city information',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: {
        description: 'City data or null if not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ICity' }
          }
        }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    return await getCityByUuid(uuid)
})
