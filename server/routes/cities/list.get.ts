defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'List cities',
    parameters: [
      { in: 'query', name: 'startAt', required: false, schema: { type: 'number' } },
      { in: 'query', name: 'limit', required: false, schema: { type: 'number' } }
    ],
    responses: {
      200: {
        description: 'Array of cities',
        content: {
          'application/json': {
            schema: { type: 'array', items: { $ref: '#/components/schemas/ICity' } }
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
  return await listCities(startAt, limit)
})
