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
    const { uploadDir = './uploads' } = useRuntimeConfig()
    let buf: Buffer
    let mime: string

    if (meta) {
        try {
            buf = await fsp.readFile(join(uploadDir, meta.path))
            mime = meta.mime
        } catch (err: any) {
            if (err.code !== 'ENOENT') throw err
        }
    }

    if (!buf) {
        buf = await fsp.readFile('defaultSkin.png')
        mime = 'image/png'
    }

    return send(event, buf, mime)
})