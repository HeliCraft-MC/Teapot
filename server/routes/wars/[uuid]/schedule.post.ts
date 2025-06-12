defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Schedule an accepted war',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: { description: 'Administrator UUID', required: true },
    responses: {
      200: {
        description: 'War scheduled',
        content: {
          'application/json': {
            schema: { type: 'object', properties: { ok: { type: 'boolean' } } }
          }
        }
      },
      400: { description: 'War must be accepted' },
      403: { description: 'Not authorized' },
      404: { description: 'War not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    const { adminUuid } = await readBody(event)
    await scheduleWar(warUuid, adminUuid)
    return { ok: true }
})
