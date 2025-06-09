defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Get specific state member',
    parameters: [
      { in: 'path', name: 'uuid', required: true },
      { in: 'path', name: 'playerUuid', required: true }
    ],
      responses: {
        200: {
          description: 'Member info',
          content: {
          'application/json': {
              schema: { $ref: '#/components/schemas/IStateMember' }
          }
          }
        },
        404: { description: 'State or member not found' }
      }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const playerUuid = getRouterParam(event, 'playerUuid')
    return await getMember(stateUuid, playerUuid)
})
