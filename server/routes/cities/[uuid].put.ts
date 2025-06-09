defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Update city information',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Fields to update',
      required: true
    },
    responses: {
      200: {
        description: 'City updated',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      400: { description: 'No fields provided' },
      500: { description: 'Failed to update city' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const body = await readBody(event)
    await updateCity(uuid, body.name, body.coordinates, body.stateUuid, body.isCapital)
    return { ok: true }
})
