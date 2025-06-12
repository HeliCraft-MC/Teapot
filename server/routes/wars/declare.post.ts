defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Declare a new war',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      description: 'War details',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              attackerStateUuid: { type: 'string' },
              defenderStateUuid: { type: 'string' },
              attackerPlayerUuid: { type: 'string' },
              name: { type: 'string' },
              reason: { type: 'string' },
              victoryCondition: { type: 'string' }
            },
            required: [
              'attackerStateUuid',
              'defenderStateUuid',
              'attackerPlayerUuid',
              'name',
              'reason',
              'victoryCondition'
            ]
          }
        }
      }
    },
    responses: {
      200: {
        description: 'War declared',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { uuid: { type: 'string' } }
            }
          }
        }
      },
      403: { description: 'Not authorized' },
      404: { description: 'State not found' },
      500: { description: 'Failed to declare war' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const uuid = await declareWar(body.attackerStateUuid, body.defenderStateUuid, body.attackerPlayerUuid, body.name, body.reason, body.victoryCondition)
    return { uuid }
})
