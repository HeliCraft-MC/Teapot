defineRouteMeta({
  openAPI: {
    tags: ['relations'],
    description: 'Review a relation change request',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Reviewer info and decision',
      required: true
    },
    responses: {
      200: {
        description: 'Request reviewed',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      403: { description: 'Not authorized' },
      404: { description: 'Request not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const requestUuid = getRouterParam(event, 'uuid')
    const { reviewerStateUuid, reviewerPlayerUuid, approve } = await readBody(event)
    await reviewRelationChange(requestUuid, reviewerStateUuid, reviewerPlayerUuid, approve)
    return { ok: true }
})
