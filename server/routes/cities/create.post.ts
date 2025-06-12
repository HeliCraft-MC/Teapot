defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Create a new city',
    requestBody: {
      description: 'City info',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              coordinates: { type: 'string' },
              stateUuid: { type: 'string' },
              isCapital: { type: 'boolean' }
            },
            required: ['name', 'coordinates']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'City created',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      },
      500: { description: 'Failed to create city' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const { name, coordinates, stateUuid, isCapital } = await readBody(event)
    await createCity(name, coordinates, stateUuid, isCapital)
    return { ok: true }
})
