import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'

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

/**
 * POST /user/[id]/skin
 * Загружает новый PNG-скин, сохраняет его в SQLite и файловой системе,
 * а затем отправляет запрос на localhost:5122/update?player=<nickname>
 * для мгновенного обновления скина в игре.
 *
 * Авторизация: Bearer <accessToken> в заголовке Authorization.
 * UUID пользователя определяется из [id]:
 *   – если [id] совпадает с UUID, берётся напрямую;
 *   – иначе — считается никнеймом и через getUserByNickname возвращается его UUID.
 */
export default defineEventHandler(async (event) => {
    // ── Получаем и резолвим id в UUID ──
    const id = getRouterParam(event, 'id')
    const uuid = await resolveUuid(id)

    // ── Авторизация по Bearer-токену ──
    const authHeader = getHeader(event, 'authorization')
    if (
        !authHeader ||
        typeof authHeader !== 'string' ||
        !authHeader.startsWith('Bearer ')
    ) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const accessToken = authHeader.slice(7)
    if (!(await checkAuth(uuid, accessToken))) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // ── Чтение multipart-формы ──
    const parts = await readMultipartFormData(event)
    if (!parts?.length) {
        throw createError({ statusCode: 400, statusMessage: 'Empty upload' })
    }
    const part = parts[0]

    // ── Лимит размера 1 МБ ──
    if (part.data.length > 1_048_576) {
        throw createError({ statusCode: 413, statusMessage: 'File too big' })
    }

    // ── Проверка PNG-сигнатуры ──
    const ft = await fileTypeFromBuffer(part.data)
    if (!ft || ft.mime !== 'image/png') {
        throw createError({ statusCode: 415, statusMessage: 'PNG only' })
    }

    // ── Нормализация: ресайз до 64×64 с пиксельным ядром и очистка мусора ──
    const safePng = await sharp(part.data)
        .resize(64, 64, { kernel: sharp.kernel.nearest })
        .png()
        .toBuffer()

    // ── Сохраняем в файловой системе и SQLite ──
    const meta = await saveSkin(uuid, safePng, 'image/png')

    // ── Триггерим обновление скина в игре ──
    const user = await getUserByUUID(uuid)
    sendUpdateRequest(user.NICKNAME).catch(() => {})

    // ── Ответ ──
    return { ok: true, ...meta }
})

/**
 * Делает GET-запрос к локальному обновлятору:
 * http://localhost:5122/update?player=<nickname>
 */
async function sendUpdateRequest(nickname: string) {
    const { $fetch } = await import('ofetch')
    await $fetch('http://localhost:5122/update', {
        query: { player: nickname },
        retry: 0
    })
}
