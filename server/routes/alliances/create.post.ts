defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Create a new alliance',
    requestBody: {
      description: 'Alliance details',
      required: true
    },
    responses: {
      200: { description: 'Alliance created' },
      403: { description: 'Not authorized' },
      404: { description: 'State not found' },
      409: { description: 'Alliance already exists' },
      422: { description: 'Invalid input' },
      500: { description: 'Failed to create alliance' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const uuid = await createAlliance(body.creatorStateUuid, body.creatorPlayerUuid, body.name, body.description, body.purpose, body.colorHex, body.flagLink)
    return { uuid }
})
