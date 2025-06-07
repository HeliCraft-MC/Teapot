defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'List cities'
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const startAt = query.startAt ? Number(query.startAt) : 0
  const limit = query.limit ? Number(query.limit) : 100
  return await listCities(startAt, limit)
})
