defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Leave an alliance',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'State and player UUIDs',
      required: true
    },
    responses: {
      200: { description: 'Left alliance' },
      403: { description: 'Not authorized' },
      404: { description: 'Membership not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    const { stateUuid, playerUuid } = await readBody(event)
    await leaveAlliance(allianceUuid, stateUuid, playerUuid)
    return { ok: true }
})
