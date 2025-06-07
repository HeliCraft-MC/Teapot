defineRouteMeta({
  openAPI: {
    tags: ['history'],
    description: 'Add a history event',
    requestBody: {
      description: 'History event data',
      required: true
    },
    responses: {
      200: { description: 'Event created' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const uuid = await addHistoryEvent(body)
    return { uuid }
})
