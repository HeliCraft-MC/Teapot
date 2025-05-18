import { join, dirname } from 'pathe'
import { promises as fsp } from 'node:fs'
import { useRuntimeConfig } from '#imports'
import { useSkinSQLite } from '~/plugins/sqlite'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import type { SkinMeta } from '~/interfaces/skins.types'

/**
 * Получить мета-данные скина по UUID
 */
export function getSkin(uuid: string): SkinMeta | undefined {
    const db = useSkinSQLite()
    return db
        .prepare('SELECT * FROM skins WHERE uuid = ?')
        .get([uuid]) as SkinMeta | undefined
}

/**
 * Сохранить новый скин:
 * 1) Удалить все старые файлы скина из диска
 *    вместе с их пустыми директориями вверх по дереву;
 * 2) Удалить старую запись из БД;
 * 3) Записать новый файл;
 * 4) Вставить новую запись в БД.
 */
export async function saveSkin(
    uuid: string,
    data: Buffer,
    mime = 'image/png'
): Promise<SkinMeta> {
    const { uploadDir = './uploads' } = useRuntimeConfig()
    const db = useSkinSQLite()

    // ——— 1) Удаляем старые файлы и их пустые папки
    const oldRows = db
        .prepare('SELECT path FROM skins WHERE uuid = ?')
        .all([uuid]) as { path: string }[]

    for (const { path } of oldRows) {
        const oldAbs = join(uploadDir, path)
        await fsp.unlink(oldAbs).catch(() => {
            // файл мог уже быть удалён — игнорируем ошибку
        })

        // Поднимаемся вверх по дереву, удаляя пустые директории
        let dir = dirname(oldAbs)
        const skinsRoot = join(uploadDir, 'skins')
        while (dir.startsWith(skinsRoot)) {
            const items = await fsp.readdir(dir)
            if (items.length === 0) {
                await fsp.rmdir(dir).catch(() => {
                    // если не получилось удалить (ENOTEMPTY или др.) — выходим
                })
                dir = dirname(dir)
            } else {
                break
            }
        }
    }

    // ——— 2) Удаляем запись из БД
    db.prepare('DELETE FROM skins WHERE uuid = ?').run([uuid])

    // ——— 3) Сохраняем новый файл
    const hex = uuidv4().replace(/-/g, '')
    const rel = `skins/${hex.slice(0, 2)}/${hex.slice(2, 4)}/${hex.slice(4, 6)}/${hex}.png`
    const abs = join(uploadDir, rel)

    await fsp.mkdir(dirname(abs), { recursive: true })
    await fsp.writeFile(abs, data)

    // ——— 4) Вставляем новую запись в БД
    db.prepare(
        `
    INSERT INTO skins(uuid, path, mime, size)
    VALUES(?, ?, ?, ?)
    `
    ).run([uuid, rel, mime, data.length])

    return {
        uuid,
        path: rel,
        mime,
        size: data.length,
        created: Date.now() / 1e3,
    }
}

/**
 * Извлечь «голову» из скина (8×8 px) и масштабировать до outSize×outSize
 */
export async function extractHead(
    skinBuf: Buffer,
    outSize = 1024
): Promise<Buffer> {
    return sharp(skinBuf)
        .extract({ left: 8, top: 8, width: 8, height: 8 })
        .resize(outSize, outSize, { kernel: sharp.kernel.nearest })
        .png()
        .toBuffer()
}
