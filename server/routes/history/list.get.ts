defineRouteMeta({
  openAPI: {
    tags: ['history'],
    description: 'List history events',
    parameters: [
      { in: 'query', name: 'startAt', required: false, schema: { type: 'number' } },
      { in: 'query', name: 'limit', required: false, schema: { type: 'number' } },
      { in: 'query', name: 'stateUuid', required: false, schema: { type: 'string' } },
      { in: 'query', name: 'playerUuid', required: false, schema: { type: 'string' } },
      { in: 'query', name: 'warUuid', required: false, schema: { type: 'string' } }
    ],
    responses: {
      200: {
        description: 'Array of history events',
        content: {
          'application/json': {
            schema: { type: 'array', items: { $ref: '#/components/schemas/IHistoryEvent' } }
          }
        }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const startAt = query.startAt ? Number(query.startAt) : 0
    const limit = query.limit ? Number(query.limit) : 100
    delete query.startAt
    delete query.limit
    return await listHistoryEvents(query as any, startAt, limit)
})
