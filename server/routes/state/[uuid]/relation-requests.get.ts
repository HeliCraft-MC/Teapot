defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'List pending relation change requests',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: { description: 'Pending requests list' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    return await listPendingRelationRequests(stateUuid)
})
