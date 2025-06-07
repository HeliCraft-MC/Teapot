defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Update battle status',
    parameters: [
      { in: 'path', name: 'battleUuid', required: true }
    ],
    requestBody: {
      description: 'Status update information',
      required: true
    },
    responses: {
      200: { description: 'Status updated' },
      403: { description: 'Not authorized' },
      404: { description: 'Battle not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const battleUuid = getRouterParam(event, 'battleUuid')
    const { status, updaterUuid, result, endDate } = await readBody(event)
    await updateBattleStatus(battleUuid, status, updaterUuid, result, endDate)
    return { ok: true }
})
