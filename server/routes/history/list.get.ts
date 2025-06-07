defineRouteMeta({
  openAPI: {
    tags: ['history'],
    description: 'List history events'
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
