defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Apply for membership in a state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Applicant UUID',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { applicantUuid: { type: 'string' } },
            required: ['applicantUuid']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Application submitted',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      400: { description: 'Already a member or dual citizenship not allowed' },
      404: { description: 'State not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
  const { uuid } = event.context.auth || {}
    await applyForMembership(stateUuid, uuid)
    return { ok: true }
})
