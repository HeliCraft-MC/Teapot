import { promises as fsp } from 'node:fs'
import { join } from 'pathe'
/**
 * GET /user/[id]/skin
 * Отдаёт PNG-файл скина (идентично /skin.png).
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const uuid = await resolveUuid(id)

    const meta = getSkin(uuid)
    if (!meta) {
        throw createError({ statusCode: 404, statusMessage: 'Skin not found' })
    }

    const { uploadDir = './uploads' } = useRuntimeConfig()
    const buf = await fsp.readFile(join(uploadDir, meta.path))

    return send(event, buf, meta.mime)
})