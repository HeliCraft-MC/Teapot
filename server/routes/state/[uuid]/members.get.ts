defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Get state members',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: { description: 'Member list' },
      404: { description: 'No members found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    return await getStateMembers(uuid)
})
