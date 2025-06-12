import { updateWarrant } from '~/utils/states/orders.utils'

defineRouteMeta({
  openAPI: {
    tags: ['warrant'],
    description: 'Update a warrant',
    parameters: [ { in: 'path', name: 'uuid', required: true } ],
    requestBody: { description: 'Patch fields', required: true },
    responses: { 200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } } }
  }
})

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  const body = await readBody(event)
  await updateWarrant(uuid, body, body.updaterUuid)
  return { ok: true }
})
