defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Start a war',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Administrator UUID',
      required: true
    },
    responses: {
      200: { description: 'War started' },
      400: { description: 'War not scheduled' },
      403: { description: 'Not authorized' },
      404: { description: 'War not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    const { adminUuid } = await readBody(event)
    await startWar(warUuid, adminUuid)
    return { ok: true }
})
