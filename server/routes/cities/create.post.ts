defineRouteMeta({
  openAPI: {
    tags: ['cities'],
    description: 'Create a new city',
    requestBody: {
      description: 'City info',
      required: true
    },
    responses: {
      200: { description: 'City created' },
      500: { description: 'Failed to create city' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const { name, coordinates, stateUuid, isCapital } = await readBody(event)
    await createCity(name, coordinates, stateUuid, isCapital)
    return { ok: true }
})
