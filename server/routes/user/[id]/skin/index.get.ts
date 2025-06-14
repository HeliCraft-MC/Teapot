import { promises as fsp } from 'node:fs'
import { join } from 'pathe'

defineRouteMeta({
  openAPI: {
    tags: ['user'],
    description: 'Get player skin PNG',
    parameters: [
      { in: 'path', name: 'id', required: true }
    ],
    responses: {
      200: {
        description: 'Skin file',
        content: {
          'image/png': { schema: { type: 'string', format: 'binary' } }
        }
      },
      400: { description: 'Invalid id' },
      404: { description: 'Skin not found' }
    }
  }
})
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