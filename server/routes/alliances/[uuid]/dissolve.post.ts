defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Dissolve an alliance',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Initiator and state info',
      required: true
    },
    responses: {
      200: { description: 'Alliance dissolved' },
      403: { description: 'Not authorized' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    const { byPlayerUuid, stateUuid } = await readBody(event)
    await dissolveAlliance(allianceUuid, byPlayerUuid, stateUuid)
    return { ok: true }
})
