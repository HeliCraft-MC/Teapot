defineRouteMeta({
  openAPI: {
    tags: ['history'],
    description: 'Count history events',
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
