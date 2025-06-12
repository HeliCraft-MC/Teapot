import { createWarrant } from "~/utils/states/orders.utils"
defineRouteMeta({
  openAPI: {
    tags: ['warrant'],
    description: 'Create a state warrant',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      description: 'Warrant data',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              stateUuid: { type: 'string' },
              affectedPlayerUuid: { type: 'string' },
              reason: { type: 'string' },
              issuedByPlayerUuid: { type: 'string' }
            },
            required: ['stateUuid', 'affectedPlayerUuid', 'reason', 'issuedByPlayerUuid']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Warrant created',
        content: {
          'application/json': {
            schema: { type: 'object', properties: { uuid: { type: 'string' } } }
          }
        }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const uuid = await createWarrant(body.stateUuid, body.affectedPlayerUuid, body.reason, body.issuedByPlayerUuid)
  return { uuid }
})
