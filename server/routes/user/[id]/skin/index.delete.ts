import { promises as fsp } from 'node:fs'
import { join } from 'pathe'
import { useRuntimeConfig } from '#imports'
import { useSkinSQLite } from '~/plugins/skinSqlite'

defineRouteMeta({
  openAPI: {
    tags: ['user'],
    description: 'Delete player skin',
    parameters: [
      { in: 'path', name: 'id', required: true }
    ],
    requestBody: { description: 'Auth credentials', required: true },
    responses: {
      200: { description: 'Skin deleted' },
      400: { description: 'Invalid id' },
      401: { description: 'Unauthorized' },
      404: { description: 'Skin not found' }
    }
  }
})

/**
 * DELETE /user/[id]/skin
 * Полностью удаляет скин (файл + запись) и триггерит обновление клиента.
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const uuid = await resolveUuid(id)

    const { uuid: authUuid, accessToken } = await readBody(event)
    if (!checkAuth(authUuid ?? uuid, accessToken)) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const meta = getSkin(uuid)
    if (!meta) throw createError({ statusCode: 404, statusMessage: 'Skin not found' })

    const { uploadDir = './uploads' } = useRuntimeConfig()
    await fsp.rm(join(uploadDir, meta.path))

    // Чистим запись
    useSkinSQLite().prepare('DELETE FROM skins WHERE uuid = ?').run(uuid)

    // Триггер обновления клиента (без ожидания)
    sendUpdateRequest(event, id).catch(() => {})

    return { ok: true }
})

/* ───────── helper ───────── */
async function sendUpdateRequest(event: any, nicknameOrUuid: string) {
    await $fetch('http://localhost:5122/update', {
        query: { player: nicknameOrUuid },
        retry: 0
    })
}
