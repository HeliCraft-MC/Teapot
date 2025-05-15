import { join } from 'pathe'
import { promises as fsp } from 'node:fs'
import { useRuntimeConfig } from '#imports'
import { useSQLite } from '~/plugins/sqlite'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import type { SkinMeta } from '~/interfaces/skins.types'

export function getSkin(uuid: string): SkinMeta | undefined {
    const db = useSQLite()
    return db
        .prepare('SELECT * FROM skins WHERE uuid = ?')
        .get([uuid]) as SkinMeta | undefined
}

export async function saveSkin(
    uuid: string,
    data: Buffer,
    mime = 'image/png'
): Promise<SkinMeta> {
    const { uploadDir = './uploads' } = useRuntimeConfig()
    const hex = uuidv4().replace(/-/g, '')
    const rel = `skins/${hex.slice(0, 2)}/${hex.slice(2, 4)}/${hex.slice(4, 6)}/${hex}.png`
    const abs = join(uploadDir, rel)

    await fsp.mkdir(abs.replace(/\/[^/]+$/, ''), { recursive: true })
    await fsp.writeFile(abs, data)

    const db = useSQLite()
    db.prepare(
        `
      INSERT INTO skins(uuid, path, mime, size)
      VALUES(?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE
      SET path = excluded.path,
          mime = excluded.mime,
          size = excluded.size,
          created = strftime('%s','now')
    `
    ).run(uuid, rel, mime, data.length)

    return { uuid, path: rel, mime, size: data.length, created: Date.now() / 1e3 }
}

export async function extractHead(
    skinBuf: Buffer,
    outSize = 1024
): Promise<Buffer> {
    // лицевой квадрат 8×8 px с координатой (8,8) в формате 64×64 Mc-скина :contentReference[oaicite:1]{index=1}
    return sharp(skinBuf)
        .extract({ left: 8, top: 8, width: 8, height: 8 })
        .resize(outSize, outSize, { kernel: sharp.kernel.nearest }) // пиксельпёрф :contentReference[oaicite:2]{index=2}
        .png()
        .toBuffer()
}
