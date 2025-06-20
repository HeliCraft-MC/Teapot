import { updateWarrant } from '~/utils/states/orders.utils'
import { IStateWarrant } from '~/interfaces/state/state.types'
import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'

defineRouteMeta({
  openAPI: {
    tags: ['warrant'],
    description: 'Update a warrant',
    parameters: [{ in: 'path', name: 'uuid', required: true }],
    requestBody: { description: 'Patch fields', required: true },
    responses: {
      200: {
        description: 'Updated',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { ok: { type: 'boolean' } }
            }
          }
        }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  const body = await readBody<Record<string, any>>(event)

  const allowedFields: Array<keyof IStateWarrant> = [
    'reason',
    'actions_taken_by_admins',
    'actions_by_admins_details',
    'actions_taken_by_state',
    'actions_by_state_details'
  ]

  const patch: Partial<IStateWarrant> = {}
  for (const field of allowedFields) {
    if (field in body) {
      // @ts-ignore
      patch[field] = body[field]
    }
  }

  const updaterUuid = body.updaterUuid
  if (typeof updaterUuid !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { statusMessageRu: 'Не указан updaterUuid' }
    })
  }

  await updateWarrant(uuid, patch, updaterUuid)

  return { ok: true }
})
