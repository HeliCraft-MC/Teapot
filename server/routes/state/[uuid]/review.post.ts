defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Review membership application',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Applicant and reviewer info',
      required: true
    },
      responses: {
        200: {
          description: 'Application reviewed',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { ok: { type: 'boolean' } } }
            }
          }
        },
        403: { description: 'Insufficient permissions' },
        404: { description: 'State not found' }
      }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const { applicantUuid, reviewerUuid, approve } = await readBody(event)
    await reviewMembershipApplication(stateUuid, applicantUuid, reviewerUuid, approve)
    return { ok: true }
})
