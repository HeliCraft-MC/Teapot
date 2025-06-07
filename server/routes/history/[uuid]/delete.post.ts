defineRouteMeta({
  openAPI: {
    tags: ['history'],
    description: 'Soft-delete a history event',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: { description: 'Actor UUID', required: true },
    responses: {
      200: { description: 'Event deleted' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const { deletedByUuid } = await readBody(event)
    await softDeleteHistoryEvent(uuid, deletedByUuid)
    return { ok: true }
})
