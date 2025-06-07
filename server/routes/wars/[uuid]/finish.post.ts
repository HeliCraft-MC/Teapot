defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Finish a war',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Result text, result action and administrator UUID',
      required: true
    },
    responses: {
      200: { description: 'War finished' },
      400: { description: 'War not active' },
      403: { description: 'Not authorized' },
      404: { description: 'War not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    const { result, resultAction, adminUuid } = await readBody(event)
    await finishWar(warUuid, result, resultAction, adminUuid)
    return { ok: true }
})
