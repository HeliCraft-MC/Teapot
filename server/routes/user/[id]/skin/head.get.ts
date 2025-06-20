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
      200: {
        description: 'Head PNG',
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
 * GET /user/[id]/skin/head
 * Отдаёт PNG-картинку головы 1024 × 1024 (идентично /head.png).
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const uuid = await resolveUuid(id)

    const meta = getSkin(uuid)
    const { uploadDir = './uploads' } = useRuntimeConfig()
    let skinBuf
    try {
        if (meta) {
            skinBuf = await fsp.readFile(join(uploadDir, meta.path))
        } else {
            throw Object.assign(new Error('Skin not found'), { code: 'ENOENT' })
        }
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            skinBuf = await fsp.readFile('defaultSkin.png')
        } else {
            throw err
        }
    }

    const headBuf = await extractHead(skinBuf)
    return send(event, headBuf, 'image/png')
})
