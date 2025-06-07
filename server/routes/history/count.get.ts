defineRouteMeta({
  openAPI: {
    tags: ['history'],
    description: 'Count history events',
    responses: {
      200: { description: 'Number of events' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    return await countHistoryEvents(query as any)
})
