import { getWarrant } from '~/utils/states/orders.utils'

defineRouteMeta({
  openAPI: {
    tags: ['warrant'],
    description: 'Get warrant by UUID',
    parameters: [ { in: 'path', name: 'uuid', required: true } ],
    responses: {
      200: { description: 'Warrant data', content: { 'application/json': { schema: { $ref: '#/components/schemas/IStateWarrant' } } } },
      404: { description: 'Warrant not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  return await getWarrant(uuid)
})
