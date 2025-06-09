defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'List alliances of a state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
      responses: {
        200: {
          description: 'List of alliances',
          content: {
          'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/IAlliance' } }
          }
          }
        }
      }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    return await listAlliancesForState(stateUuid)
})
