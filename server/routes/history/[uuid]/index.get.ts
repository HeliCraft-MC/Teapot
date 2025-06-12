defineRouteMeta({
  openAPI: {
    tags: ['history'],
    description: 'Get history event by UUID',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: {
        description: 'History event data',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/IHistoryEvent' }
          }
        }
      },
      404: { description: 'History event not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    return await getHistoryEvent(uuid)
})
