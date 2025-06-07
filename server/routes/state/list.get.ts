defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'List states'
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const startAt = query.startAt ? Number(query.startAt) : 0
  const limit = query.limit ? Number(query.limit) : 100
  return await listStates(startAt, limit)
})
