import {H3Error, MultiPartData} from "h3";
import {AlliencePurpose} from "~/interfaces/state/diplomacy.types";
import sharp from "sharp";
import {fileTypeFromBuffer} from "file-type";

defineRouteMeta({
  openAPI: {
    tags: ['alliances'],
    description: 'Create a new alliance with a flag upload.',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      description: 'Alliance details and flag image',
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              creatorStateUuid: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              purpose: { type: 'string', enum: Object.values(AlliencePurpose) },
              colorHex: { type: 'string', example: '#c0ffee' },
              flag: { type: 'string', format: 'binary' } // Поле для файла
            },
            required: [
              'creatorStateUuid',
              'name',
              'description',
              'purpose',
              'colorHex',
              'flag'
            ]
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Alliance created successfully',
        content: { 'application/json': { schema: { type: 'object', properties: { uuid: { type: 'string' } } } } }
      },
      400: { description: 'Bad Request (e.g., missing flag file)' },
      401: { description: 'Unauthenticated' },
      403: { description: 'Not authorized' },
      404: { description: 'Creator state not found' },
      409: { description: 'Alliance with this name already exists' },
      413: { description: 'File too large' },
      415: { description: 'Unsupported file type (PNG only)' },
      422: { description: 'Invalid input data' },
      500: { description: 'Failed to create alliance' }
    }
  }
});


// Обновленный обработчик маршрута
export default defineEventHandler(async (event) => {
  // 1. Проверка аутентификации пользователя
  const { uuid: creatorPlayerUuid } = event.context.auth || {};
  if (!creatorPlayerUuid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthenticated' });
  }

  const parts = await readMultipartFormData(event);
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid multipart/form-data' });
  }

  // 2. Разбор данных из multipart/form-data
  const bodyData: Record<string, any> = {};
  let filePart: MultiPartData | undefined;

  for (const part of parts) {
    if (part.name) {
      if (part.filename && part.name === 'flag') {
        filePart = part;
      } else if (part.data) {
        bodyData[part.name] = part.data.toString();
      }
    }
  }

  // 3. Валидация файла флага
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Flag file is required', data: { statusMessageRu: 'Файл флага обязателен' } });
  }
  if (filePart.data.length > 2 * 1024 * 1024) { // Лимит 2MB
    throw createError({ statusCode: 413, statusMessage: 'File too large', data: { statusMessageRu: 'Файл слишком большой (макс. 2MB)' } });
  }
  const fileType = await fileTypeFromBuffer(filePart.data);
  if (!fileType || fileType.mime !== 'image/png') {
    throw createError({ statusCode: 415, statusMessage: 'Only PNG images are allowed', data: { statusMessageRu: 'Разрешены только изображения в формате PNG' } });
  }

  // 4. Извлечение данных из тела запроса
  const {
    creatorStateUuid,
    name,
    description,
    purpose, // Ожидается строка, соответствующая AlliancePurpose
    colorHex,
  } = bodyData;

  // Проверка наличия всех необходимых текстовых полей
  if (!creatorStateUuid || !name || !description || !purpose || !colorHex) {
    throw createError({ statusCode: 422, statusMessage: 'Missing required fields' });
  }

  try {
    const flagBuffer = await sharp(filePart.data).toBuffer();

    // 5. Вызов основной логики создания альянса
    const allianceUuid = await createAlliance(
        creatorStateUuid,
        creatorPlayerUuid,
        name,
        description,
        purpose as AlliencePurpose, // Приведение типа
        colorHex,
        flagBuffer
    );

    return { uuid: allianceUuid };
  } catch (e) {
    // Обработка ошибок, которые могут быть выброшены из createAlliance или других функций
    if (e instanceof H3Error) {
      throw e;
    }
    console.error('Alliance creation failed:', e);
    throw createError({
      statusCode: 500,
      statusMessage: 'Unexpected server error while creating alliance'
    });
  }
});
