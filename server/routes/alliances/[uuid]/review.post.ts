defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Review alliance join request',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Applicant and approver info',
      required: true
    },
    responses: {
      200: { description: 'Review processed' },
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
