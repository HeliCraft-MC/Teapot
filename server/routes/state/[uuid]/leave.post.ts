defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Leave a state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Player UUID',
      required: true
    },
      responses: {
        200: {
          description: 'Left state',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { ok: { type: 'boolean' } } }
            }
          }
        },
        400: { description: 'Cannot leave as ruler' },
        404: { description: 'State or player not found' }
      }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const { playerUuid } = await readBody(event)
    await leaveState(stateUuid, playerUuid)
    return { ok: true }
})
