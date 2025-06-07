defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Send a request for a state to join an alliance',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'State and player UUIDs',
      required: true
    },
    responses: {
      200: { description: 'Join request created' },
      400: { description: 'Already member or request pending' },
      403: { description: 'Not authorized' },
      404: { description: 'Alliance or state not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    const { stateUuid, playerUuid } = await readBody(event)
    await requestAllianceJoin(allianceUuid, stateUuid, playerUuid)
    return { ok: true }
})
