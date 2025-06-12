defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Review alliance join request',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Applicant and approver info',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              applicantStateUuid: { type: 'string' },
              approverStateUuid: { type: 'string' },
              approverPlayerUuid: { type: 'string' },
              approve: { type: 'boolean' }
            },
            required: ['applicantStateUuid', 'approverStateUuid', 'approverPlayerUuid', 'approve']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Review processed',
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
      404: { description: 'Application not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    const { applicantStateUuid, approverStateUuid, approverPlayerUuid, approve } = await readBody(event)
    await reviewAllianceJoin(allianceUuid, applicantStateUuid, approverStateUuid, approverPlayerUuid, approve)
    return { ok: true }
})
