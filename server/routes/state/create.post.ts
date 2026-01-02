import {declareNewState} from "~/utils/states/state.utils";
import {H3Error, MultiPartData} from "h3";
import {fileTypeFromBuffer} from "file-type";
import sharp from "sharp";
import {GovernmentForm} from "~/interfaces/state/state.types";

defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'Create a state',
  parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
  ],
  requestBody: {
      description: 'State details and flag image',
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
                      file: { type: 'string', format: 'binary' }
                  },
                  required: ['name', 'description', 'color', 'govForm', 'hasElections', 'file']
              }
          }
      }
  },
    responses: {
      200: {
        description: 'State created',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                uuid: { type: 'string' }
              }
            }
          }
        }
      },
      401: { description: 'Unauthenticated' },
      413: { description: 'File too big' },
      415: { description: 'PNG only' },
      500: { description: 'Unexpected server error' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const { uuid } = event.context.auth || {}

    if (!uuid) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthenticated' })
    }

    const parts = await readMultipartFormData(event)

    const bodyData: Record<string, any> = {};
    let filePart: MultiPartData | undefined;

    if (parts) {
        for (const part of parts) {
            if (part.name) {
                if (part.filename) {
                    if (part.name === 'flag') {
                        filePart = part;
                    }
                } else {
                    bodyData[part.name] = part.data.toString();
                }
            }
        }
    }

    const {
        name,
        description,
        color,
        govForm, // Это будет строка, ее нужно будет привести к типу GovernmentForm
        hasElections, // Это будет строка 'true'/'false'
        telegramLink,
        allowDualCitezenship, // В запросе 'allowDualCitezenship', в функции 'allowDualCitizenship'
        freeEntry, // Это будет строка 'true'/'false'
        freeEntryDesc,
    } = bodyData;

    if (!filePart) {
        throw createError({ statusCode: 400, statusMessage: 'Flag file is missing' })
    }

    if (filePart.data.length > 1_048_576) { // 1MB
        throw createError({ statusCode: 413, statusMessage: 'File too big' })
    }
    const ft = await fileTypeFromBuffer(filePart.data)
    if (!ft || ft.mime !== 'image/png') {
        throw createError({ statusCode: 415, statusMessage: 'PNG only' })
    }

    // Преобразование строковых значений в булевы и другие типы
    const parsedGovForm = govForm as GovernmentForm; // Убедитесь, что значение govForm соответствует одному из значений GovernmentForm
    const parsedHasElections = hasElections === 'true';
    // Обратите внимание на имя свойства: в запросе 'allowDualCitezenship', а функция ожидает 'allowDualCitizenship'
    const parsedAllowDualCitizenship = allowDualCitezenship === 'true';
    const parsedFreeEntry = freeEntry === 'true';

    try{
        const stateUuid = await declareNewState(
            name,
            description,
            color,
            parsedGovForm,
            parsedHasElections,
            telegramLink,
            uuid, // creatorUuid
            uuid, // rulerUuid
            parsedAllowDualCitizenship, // Используем преобразованное значение и правильное имя
            parsedFreeEntry,
            freeEntryDesc,
            await sharp(filePart.data).toBuffer() // Передаем filePart.data
        )
        return { uuid: stateUuid }
    } catch (e) {
        if (e instanceof H3Error || e instanceof Error) {
            throw e;
        }  else {
            console.warn(e)
            throw createError({
                statusCode: 500,
                statusMessage: 'Unexpected server error'
            })
        }
    }
})