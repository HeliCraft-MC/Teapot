import { promises as fsp } from 'node:fs'
import { join } from 'pathe'

export default defineEventHandler(async (event) => {
    const flagParam = getRouterParam(event, 'flag')
    if (!flagParam) {
        throw createError({ statusCode: 400, statusMessage: 'No flag specified' })
    }

    // Поддержка [...flag] — может быть массив или строка
    const flagPath = Array.isArray(flagParam) ? flagParam.join('/') : flagParam
    const { uploadDir = './uploads' } = useRuntimeConfig()
    const absPath = join(uploadDir, 'flags', flagPath)

    let buf: Buffer
    try {
        buf = await fsp.readFile(absPath)
    } catch (e) {
        throw createError({ statusCode: 404, statusMessage: 'Flag not found' })
    }

    return send(event, buf, 'image/png')
})