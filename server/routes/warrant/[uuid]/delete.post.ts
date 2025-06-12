import { deleteWarrant } from '~/utils/states/orders.utils'

defineRouteMeta({
  openAPI: {
    tags: ['warrant'],
    description: 'Delete a warrant',
    parameters: [ { in: 'path', name: 'uuid', required: true } ],
    requestBody: { description: 'Requester UUID', required: true },
    responses: { 200: { description: 'Deleted', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } } }
  }
})

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  const body = await readBody(event)
  await deleteWarrant(uuid, body.requesterUuid)
  return { ok: true }
})
