defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Apply for membership in a state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Applicant UUID',
      required: true
    },
    responses: {
      200: { description: 'Application submitted' },
      400: { description: 'Already a member or dual citizenship not allowed' },
      404: { description: 'State not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const { applicantUuid } = await readBody(event)
    await applyForMembership(stateUuid, applicantUuid)
    return { ok: true }
})
