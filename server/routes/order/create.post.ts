import { createOrder } from '~/utils/states/orders.utils'

defineRouteMeta({
  openAPI: {
    tags: ['order'],
    description: 'Create a state order',
    parameters: [ { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } } ],
    requestBody: {
      description: 'Order data',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              stateUuid: { type: 'string' },
              title: { type: 'string' },
              text: { type: 'string' },
              issuedByPlayerUuid: { type: 'string' },
              importance: { type: 'string' },
              expiresAt: { type: 'number', nullable: true }
            },
            required: ['stateUuid', 'title', 'text', 'issuedByPlayerUuid']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Order created',
        content: { 'application/json': { schema: { type: 'object', properties: { uuid: { type: 'string' } } } } }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const uuid = await createOrder(body.stateUuid, body.title, body.text, body.issuedByPlayerUuid, body.importance, body.expiresAt)
  return { uuid }
})
