defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Delete a city',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    responses: {
      200: {
        description: 'City deleted',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      404: { description: 'City not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    await deleteCity(uuid)
    return { ok: true }
})
