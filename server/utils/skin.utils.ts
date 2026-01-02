import { join, dirname } from 'pathe'
import { promises as fsp } from 'node:fs'
import { useRuntimeConfig } from '#imports'
import { useSkinSQLite } from '~/plugins/skinSqlite'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import type { SkinMeta } from '~/interfaces/skins.types'

function normalizeUuid(raw: string): string {
  return raw.replace(/-/g, '').toLowerCase()
}

/**
 * Получить мета-данные скина по UUID
 */
export function getSkin(uuid: string): SkinMeta | undefined {
  const db = useSkinSQLite()
  const normalizedUuid = normalizeUuid(uuid)
  return db
    .prepare('SELECT * FROM skins WHERE uuid = ?')
    .get([normalizedUuid]) as SkinMeta | undefined
}

/**
 * Рекурсивно удаляет пустые директории внутри заданного корня
 */
async function removeEmptyDirs(root: string): Promise<void> {
  const entries = await fsp.readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) {
      await removeEmptyDirs(fullPath)
      const rem = await fsp.readdir(fullPath)
      if (rem.length === 0) {
        await fsp.rmdir(fullPath)
      }
    }
  }
}

/**
 * Удаляет файлы скинов по списку путей
 */
async function deleteSkinsFiles(uploadDir: string, paths: string[]): Promise<void> {
  await Promise.all(
    paths.map(path =>
      fsp.rm(join(uploadDir, path), { force: true }).catch(() => { })
    )
  )
}

/**
 * Полностью удаляет скин пользователя (файлы и запись в БД)
 * Возвращает true если скин был удалён, false если скина не было
 */
export async function deleteSkin(uuid: string): Promise<boolean> {
  const { uploadDir = './uploads' } = useRuntimeConfig()
  const db = useSkinSQLite()
  const normalizedUuid = normalizeUuid(uuid)

  console.log(`[SkinUtils] Attempting to delete skin for UUID: ${uuid} (normalized: ${normalizedUuid})`)

  // 1. Находим файлы
  const rows = db.prepare('SELECT path FROM skins WHERE uuid = ?').all(normalizedUuid) as { path: string }[]

  if (rows.length === 0) {
    console.log(`[SkinUtils] No skin found for UUID: ${normalizedUuid}`)
    return false
  }

  console.log(`[SkinUtils] Found ${rows.length} skin record(s) for UUID: ${normalizedUuid}`)

  // 2. Удаляем из БД
  const result = db.prepare('DELETE FROM skins WHERE uuid = ?').run(normalizedUuid)
  console.log(`[SkinUtils] Deleted ${result.changes} record(s) from DB`)

  // 3. Удаляем файлы
  const paths = rows.map(r => r.path)
  console.log(`[SkinUtils] Deleting files: ${paths.join(', ')}`)
  await deleteSkinsFiles(uploadDir, paths)

  return true
}

/**
 * Сохраняет новый скин:
 * 1) Удаляет старые файлы через fs.rm
 * 2) Очищает пустые директории
 * 3) Записывает новый файл
 * 4) Добавляет запись в БД
 */
export async function saveSkin(
  uuid: string,
  data: Buffer,
  mime = 'image/png'
): Promise<{ uuid: string; path: string; mime: string; size: number; created: number }> {
  const { uploadDir = './uploads' } = useRuntimeConfig()
  const db = useSkinSQLite()
  const skinsRoot = join(uploadDir, 'skins')
  const normalizedUuid = normalizeUuid(uuid)

  // Выбираем старые пути и удаляем их из БД
  const oldRows = db.prepare('SELECT path FROM skins WHERE uuid = ?').all(normalizedUuid) as { path: string }[]
  const pathsToDelete = oldRows.map(r => r.path)

  // Удаляем из БД
  db.prepare('DELETE FROM skins WHERE uuid = ?').run(normalizedUuid)

  // Удаляем файлы
  await deleteSkinsFiles(uploadDir, pathsToDelete)

  // Генерируем путь для нового файла
  const hex = uuidv4().replace(/-/g, '')
  const relPath = `skins/${hex.slice(0, 2)}/${hex.slice(2, 4)}/${hex.slice(4, 6)}/${hex}.png`
  const absPath = join(uploadDir, relPath)

  // Создаём директории и пишем файл
  await fsp.mkdir(dirname(absPath), { recursive: true })
  await fsp.writeFile(absPath, data)

  // Вставляем новую запись в БД
  db.prepare(
    'INSERT INTO skins(uuid, path, mime, size) VALUES(?, ?, ?, ?)'
  ).run(normalizedUuid, relPath, mime, data.length)

  // Очищаем пустые директории
  await removeEmptyDirs(skinsRoot)

  return {
    uuid: normalizedUuid,
    path: relPath,
    mime,
    size: data.length,
    created: Math.floor(Date.now() / 1000)
  }
}

/**
 * Извлекает голову персонажа Minecraft (базовый слой + оверлей) из полного скина и возвращает её в виде PNG-буфера.
 * Сначала параллельно извлекаются оба слоя в исходном разрешении,
 * затем они объединяются, а результат масштабируется до нужного размера.
 * @param {Buffer} skinBuf - Буфер полного изображения скина (64×64 или 64×32).
 * @param {number} outSize - Размер выходного изображения по ширине и высоте в пикселях (по умолчанию 1024).
 * @returns {Promise<Buffer>} - Promise, который резолвится PNG-буфером с головой.
 */
export async function extractHead(
  skinBuf: Buffer,
  outSize: number = 1024
): Promise<Buffer> {
  // Области для базового слоя головы и оверлея (каждая 8×8 пикселей)
  const baseRegion: sharp.Region = { left: 8, top: 8, width: 8, height: 8 };
  const overlayRegion: sharp.Region = { left: 40, top: 8, width: 8, height: 8 };

  try {
    // Параллельно извлекаем базовый слой и оверлей
    const [baseBuf, overlayBuf] = await Promise.all([
      sharp(skinBuf).extract(baseRegion).png().toBuffer(),
      sharp(skinBuf).extract(overlayRegion).png().toBuffer(),
    ]);

    // Объединяем оверлей поверх базового слоя и масштабируем до нужного размера
    const overlay2Buf = await sharp(overlayBuf).resize(outSize, outSize, { kernel: sharp.kernel.nearest }).png().toBuffer();
    const headBuf = await sharp(baseBuf)
      .composite([{ input: overlay2Buf }])
      .resize(outSize, outSize, { kernel: sharp.kernel.nearest })
      .png()
      .toBuffer();

    return headBuf;
  } catch (err) {
    // При любой ошибке пробрасываем дальше
    throw err;
  }
}
