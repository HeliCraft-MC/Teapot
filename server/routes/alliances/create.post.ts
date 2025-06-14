defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Create a new alliance',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      description: 'Alliance details',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              creatorStateUuid: { type: 'string' },
              creatorPlayerUuid: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              purpose: { type: 'string' },
              colorHex: { type: 'string' },
              flagLink: { type: 'string' }
            },
            required: [
              'creatorStateUuid',
              'creatorPlayerUuid',
              'name',
              'description',
              'purpose',
              'colorHex',
              'flagLink'
            ]
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Alliance created',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { uuid: { type: 'string' } }
            }
          }
        }
      },
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
