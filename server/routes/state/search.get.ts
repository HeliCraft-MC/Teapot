defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Search states'
  }
})

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const filters: any = {}
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) filters[key] = value
    }
    const startAt = query.startAt ? Number(query.startAt) : undefined
    const limit = query.limit ? Number(query.limit) : undefined
    delete filters.startAt
    delete filters.limit
    return await searchStatesByFilters(filters, startAt, limit)
})
