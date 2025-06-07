defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Get members count for a state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: { description: 'Members count' },
      404: { description: 'State not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    return await getStateMembersCount(stateUuid)
})
