defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Get alliance by UUID',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: {
        description: 'Alliance info',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/IAlliance' }
          }
        }
      },
      404: { description: 'Alliance not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    return await getAllianceByUuid(allianceUuid)
})
