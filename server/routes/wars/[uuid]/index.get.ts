defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Get war details',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: {
        description: 'War information',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/IWar' }
          }
        }
      },
      404: { description: 'War not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    return await getWarByUuid(warUuid)
})
