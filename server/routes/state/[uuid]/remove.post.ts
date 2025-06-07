defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Remove a member from state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Member and initiator UUIDs',
      required: true
    },
    responses: {
      200: { description: 'Member removed' },
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
