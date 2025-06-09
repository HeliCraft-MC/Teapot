defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'List battles for a war',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: {
        description: 'Battles list',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/IWarBattle' }
            }
          }
        }
      },
      404: { description: 'War not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    return await listWarBattles(warUuid)
})
