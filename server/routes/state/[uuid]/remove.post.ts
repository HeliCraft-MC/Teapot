defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Remove a member from state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Member and initiator UUIDs',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              uuidToRemove: { type: 'string' },
              uuidWhoRemoved: { type: 'string' }
            },
            required: ['uuidToRemove', 'uuidWhoRemoved']
          }
        }
      }
    },
      responses: {
        200: {
          description: 'Member removed',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { ok: { type: 'boolean' } } }
            }
          }
        },
        403: { description: 'Insufficient permissions' },
        404: { description: 'State not found' }
      }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const { uuidToRemove, uuidWhoRemoved } = await readBody(event)
    await removeMember(stateUuid, uuidToRemove, uuidWhoRemoved)
    return { ok: true }
})
