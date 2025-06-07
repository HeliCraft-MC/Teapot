defineRouteMeta({
  openAPI: {
    tags: ['relations'],
    description: 'Get relation between two states',
    parameters: [
      { in: 'query', name: 'stateUuidA', required: true },
      { in: 'query', name: 'stateUuidB', required: true }
    ],
    responses: {
      200: { description: 'Relation kind or null' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const a = String(query.stateUuidA)
    const b = String(query.stateUuidB)
    return await getRelation(a, b)
})
