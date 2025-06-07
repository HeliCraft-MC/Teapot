defineRouteMeta({
  openAPI: {
    tags: ['relations'],
    description: 'Request a change in relations between two states',
    requestBody: {
      description: 'Proposer state, target state, desired kind and proposer player UUID',
      required: true
    },
    responses: {
      200: { description: 'Request created with UUID' },
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
