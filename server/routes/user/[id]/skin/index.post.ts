import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import type { H3Event } from 'h3'
import { notifySkinChange } from '~/utils/telegram.utils'

defineRouteMeta({
    openAPI: {
        tags: ['user'],
        description: 'Upload a new player skin',
        parameters: [
            { in: 'path', name: 'id', required: true },
            { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
        ],
        requestBody: { description: 'PNG skin file', required: true },
        responses: {
            200: {
                description: 'Skin uploaded',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                ok: { type: 'boolean' },
                                uuid: { type: 'string' },
                                path: { type: 'string' },
                                mime: { type: 'string' },
                                size: { type: 'number' },
                                created: { type: 'number' }
                            }
                        }
                    }
                }
            },
            400: { description: 'Invalid request or id' },
            401: { description: 'Unauthorized' },
            404: { description: 'User not found' },
            413: { description: 'File too big' },
            415: { description: 'PNG only' }
        }
    }
})

export default defineEventHandler(async (event: H3Event) => {
    // Получаем и резолвим id в UUID
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
    }
    const uuid = await resolveUuid(id)

    // Авторизация по Bearer-токену
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const accessToken = authHeader.slice(7)
    if (!(await checkAuth(uuid, accessToken))) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Парсинг multipart-формы
    const parts = await readMultipartFormData(event)
    if (!parts.length) {
        throw createError({ statusCode: 400, statusMessage: 'Empty upload' })
    }
    const filePart = parts[0]

    // Лимит размера 1 МБ
    if (filePart.data.length > 1_048_576) {
        throw createError({ statusCode: 413, statusMessage: 'File too big' })
    }

    // Проверка PNG-сигнатуры
    const ft = await fileTypeFromBuffer(filePart.data)
    if (ft?.mime !== 'image/png') {
        throw createError({ statusCode: 415, statusMessage: 'PNG only' })
    }

    // Нормализация изображения
    const safePng = await sharp(filePart.data)
        .resize(64, 64, { kernel: sharp.kernel.nearest })
        .png()
        .toBuffer()

    // Сохранение скина и очистка файловой системы
    const meta = await saveSkin(uuid, safePng, 'image/png')

    // Получаем никнейм игрока для уведомления
    const user = await getUserByUUID(uuid)
    // Логгируем смену скина в Telegram (fire-and-forget)
    notifySkinChange(user.NICKNAME, safePng).catch((e) => console.error('Telegram notify error:', e))

    // Триггер обновления скина в игре (не ждём ответа)
    import('ofetch').then(({ $fetch }) =>
        $fetch('http://localhost:5122/update', { query: { player: user.NICKNAME }, retry: 0 })
    ).catch(() => { })

    return { ok: true, ...meta }
})
