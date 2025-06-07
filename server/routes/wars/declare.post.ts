defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Declare a new war',
    requestBody: {
      description: 'War details',
      required: true
    },
    responses: {
      200: { description: 'War declared' },
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
