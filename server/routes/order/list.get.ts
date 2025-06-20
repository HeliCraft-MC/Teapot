import { listOrdersByState } from '~/utils/states/orders.utils'

defineRouteMeta({
  openAPI: {
    tags: ['order'],
    description: 'List orders for a state',
    parameters: [
      { in: 'query', name: 'stateUuid', required: true, schema: { type: 'string' } },
      { in: 'query', name: 'startAt', required: false, schema: { type: 'number' } },
      { in: 'query', name: 'limit', required: false, schema: { type: 'number' } }
    ],
    responses: {
      200: {
        description: 'Array of orders',
        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/IStateOrder' } } } }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const start = query.startAt ? Number(query.startAt) : 0
  const limit = query.limit ? Number(query.limit) : 100
  return await listOrdersByState(String(query.stateUuid), start, limit)
})
