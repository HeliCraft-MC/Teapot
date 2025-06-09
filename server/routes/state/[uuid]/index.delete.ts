defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Delete a state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Administrator UUID',
      required: true
    },
      responses: {
        200: {
          description: 'State deleted',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { ok: { type: 'boolean' } } }
            }
          }
        },
        403: { description: 'Forbidden' },
        404: { description: 'State not found' },
        500: { description: 'Failed to delete state' }
      }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const { adminUuid } = await readBody(event)
    await deleteState(uuid, adminUuid)
    return { ok: true }
})
