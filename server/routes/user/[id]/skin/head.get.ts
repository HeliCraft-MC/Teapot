import { promises as fsp } from 'node:fs'
import { join } from 'pathe'

defineRouteMeta({
  openAPI: {
    tags: ['user'],
    description: 'Get head of player skin as PNG',
    parameters: [
      { in: 'path', name: 'id', required: true }
    ],
    responses: {
      200: { description: 'Head PNG' },
      400: { description: 'Invalid id' },
      404: { description: 'Skin not found' }
    }
  }
})

/**
 * GET /user/[id]/skin/head
 * Отдаёт PNG-картинку головы 1024 × 1024 (идентично /head.png).
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const uuid = await resolveUuid(id)

    const meta = getSkin(uuid)
    if (!meta) throw createError({ statusCode: 404, statusMessage: 'Skin not found' })

    const { uploadDir = './uploads' } = useRuntimeConfig()
    const skinBuf = await fsp.readFile(join(uploadDir, meta.path))
    const headBuf = await extractHead(skinBuf)
    return send(event, headBuf, 'image/png')
})
