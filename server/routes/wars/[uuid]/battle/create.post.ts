defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Create a battle for a war',
    parameters: [
      { in: 'path', name: 'uuid', required: true },
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      description: 'Battle details',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              creatorStateUuid: { type: 'string' },
              creatorPlayerUuid: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              startDate: { type: 'number' }
            },
            required: [
              'creatorStateUuid',
              'creatorPlayerUuid',
              'name',
              'description',
              'type',
              'startDate'
            ]
          }
        }
      }
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
