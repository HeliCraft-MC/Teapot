import { updateState } from '~/utils/states/state.utils'
import { H3Error, MultiPartData } from 'h3'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import { GovernmentForm } from '~/interfaces/state/state.types'

defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Update state information',
    parameters: [
      { in: 'path', name: 'uuid', required: true },
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      description: 'Fields to update with optional flag file',
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              color: { type: 'string' },
              govForm: { type: 'string' },
              hasElections: { type: 'boolean' },
              telegramLink: { type: 'string' },
              allowDualCitezenship: { type: 'boolean' },
              freeEntry: { type: 'boolean' },
              freeEntryDesc: { type: 'string' },
              flag: { type: 'string', format: 'binary' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'State updated',
        content: {
          'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } }
        }
      },
      400: { description: 'No fields to update or invalid request' },
      401: { description: 'Unauthenticated' },
      403: { description: 'Forbidden' },
      413: { description: 'File too big' },
      415: { description: 'PNG only' },
      500: { description: 'Failed to update state' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const stateUuid = getRouterParam(event, 'uuid')
  const { uuid: updaterUuid } = event.context.auth || {}

  if (!updaterUuid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthenticated' })
  }

  const parts = await readMultipartFormData(event)
  const bodyData: Record<string, any> = {}
  let filePart: MultiPartData | undefined

  if (parts) {
    for (const part of parts) {
      if (part.name) {
        if (part.filename) {
          if (part.name === 'flag') filePart = part
        } else {
          bodyData[part.name] = part.data.toString()
        }
      }
    }
  }

  const patch: any = {}
  if (bodyData.name !== undefined) patch.name = bodyData.name
  if (bodyData.description !== undefined) patch.description = bodyData.description
  if (bodyData.color !== undefined) patch.color = bodyData.color
  if (bodyData.govForm !== undefined) patch.govForm = bodyData.govForm as GovernmentForm
  if (bodyData.hasElections !== undefined) patch.hasElections = bodyData.hasElections === 'true'
  if (bodyData.telegramLink !== undefined) patch.telegramLink = bodyData.telegramLink
  if (bodyData.allowDualCitezenship !== undefined) patch.allowDualCitizenship = bodyData.allowDualCitezenship === 'true'
  if (bodyData.freeEntry !== undefined) patch.freeEntry = bodyData.freeEntry === 'true'
  if (bodyData.freeEntryDesc !== undefined) patch.freeEntryDescription = bodyData.freeEntryDesc

  if (filePart) {
    if (filePart.data.length > 1_048_576) {
      throw createError({ statusCode: 413, statusMessage: 'File too big' })
    }
    const ft = await fileTypeFromBuffer(filePart.data)
    if (!ft || ft.mime !== 'image/png') {
      throw createError({ statusCode: 415, statusMessage: 'PNG only' })
    }
    patch.flag = await sharp(filePart.data).toBuffer()
  }

  if (!Object.keys(patch).length) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  await updateState(stateUuid, patch, updaterUuid)
  return { ok: true }
})
