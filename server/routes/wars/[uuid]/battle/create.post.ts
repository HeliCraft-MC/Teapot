defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Create a battle for a war',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Battle details',
      required: true
    },
    responses: {
      200: {
        description: 'Battle created',
        content: {
          'application/json': {
            schema: { type: 'object', properties: { uuid: { type: 'string' } } }
          }
        }
      },
      403: { description: 'Not authorized' },
      404: { description: 'War not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    const { creatorStateUuid, creatorPlayerUuid, name, description, type, startDate } = await readBody(event)
    const uuid = await createBattle(warUuid, creatorStateUuid, creatorPlayerUuid, name, description, type, startDate)
    return { uuid }
})
