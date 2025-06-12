defineRouteMeta({
  openAPI: {
    tags: ['relations'],
    description: 'Request a change in relations between two states',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      description: 'Proposer state, target state, desired kind and proposer player UUID',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              proposerStateUuid: { type: 'string' },
              targetStateUuid: { type: 'string' },
              requestedKind: { type: 'string' },
              proposerPlayerUuid: { type: 'string' }
            },
            required: ['proposerStateUuid', 'targetStateUuid', 'requestedKind', 'proposerPlayerUuid']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Request created with UUID',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { uuid: { type: 'string' } }
            }
          }
        }
      },
      400: { description: 'Bad request or already requested' },
      403: { description: 'Not authorized' },
      404: { description: 'State not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const { proposerStateUuid, targetStateUuid, requestedKind, proposerPlayerUuid } = await readBody(event)
    const uuid = await requestRelationChange(proposerStateUuid, targetStateUuid, requestedKind, proposerPlayerUuid)
    return { uuid }
})
