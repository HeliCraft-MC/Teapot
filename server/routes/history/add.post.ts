defineRouteMeta({
  openAPI: {
    tags: ['history'],
    description: 'Add a history event',
    requestBody: {
      description: 'History event data',
      required: true
    },
    responses: {
      200: {
        description: 'Event created',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { uuid: { type: 'string' } }
            }
          }
        }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const uuid = await addHistoryEvent(body)
    return { uuid }
})
