defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Reject a state',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Administrator UUID',
      required: true
    },
    responses: {
      200: { description: 'State rejected' },
      403: { description: 'Forbidden' },
      404: { description: 'State not found' },
      500: { description: 'Failed to reject state' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const { adminUuid } = await readBody(event)
    await rejectState(uuid, adminUuid)
    return { ok: true }
})
