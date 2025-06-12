defineRouteMeta({
  openAPI: {
    tags: ['history'],
    description: 'Count history events',
    parameters: [
      { in: 'query', name: 'stateUuid', required: false, schema: { type: 'string' } },
      { in: 'query', name: 'playerUuid', required: false, schema: { type: 'string' } },
      { in: 'query', name: 'warUuid', required: false, schema: { type: 'string' } }
    ],
    responses: {
      200: {
        description: 'Number of events',
        content: {
          'application/json': {
            schema: { type: 'number' }
          }
        }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    return await countHistoryEvents(query as any)
})
