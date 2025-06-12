import { getOrder } from '~/utils/states/orders.utils'

defineRouteMeta({
  openAPI: {
    tags: ['order'],
    description: 'Get order by UUID',
    parameters: [ { in: 'path', name: 'uuid', required: true } ],
    responses: {
      200: { description: 'Order data', content: { 'application/json': { schema: { $ref: '#/components/schemas/IStateOrder' } } } },
      404: { description: 'Order not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  return await getOrder(uuid)
})
