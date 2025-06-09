defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Get state by UUID',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: {
        description: 'State data',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/IState' }
          }
        }
      },
      404: { description: 'State not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    return await getStateByUuid(uuid)
})
