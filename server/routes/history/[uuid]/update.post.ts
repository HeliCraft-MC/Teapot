defineRouteMeta({
  openAPI: {
    tags: ['history'],
    description: 'Update a history event',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: { description: 'Patch fields', required: true },
    responses: {
      200: {
        description: 'Event updated',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const body = await readBody(event)
    await updateHistoryEvent(uuid, body, body.updaterUuid)
    return { ok: true }
})
