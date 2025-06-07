defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'List members of an alliance',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: { description: 'Array of members' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    return await listAllianceMembers(allianceUuid)
})
