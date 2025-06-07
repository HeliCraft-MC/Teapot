defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Get war details',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: { description: 'War information' },
      404: { description: 'War not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    return await getWarByUuid(warUuid)
})
