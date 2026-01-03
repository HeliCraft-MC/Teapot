import { v4 as uuidv4 } from 'uuid'
import { useSkinSQLite } from '~/plugins/skinSqlite'
import { useFileService } from './file.service'
import { getUserByUUID } from './user.utils'
import { isUserBanned } from './banlist.utils'
import type {
  GalleryImage,
  GalleryImagePublic,
  GalleryImageStatus,
  GalleryUserInfo,
  CreateGalleryImageDto,
  UpdateGalleryImageOwnerDto,
  UpdateGalleryImageAdminDto,
  GalleryListFilters,
  PaginatedResponse
} from '~/interfaces/gallery.types'

/**
 * Normalize UUID format (remove dashes, lowercase)
 */
function normalizeUuid(raw: string): string {
  return raw.replace(/-/g, '').toLowerCase()
}

/**
 * Get user info from UUID
 */
async function getUserInfo(uuid: string): Promise<GalleryUserInfo | null> {
  try {
    const user = await getUserByUUID(uuid)
    return {
      uuid: user.UUID,
      nickname: user.NICKNAME
    }
  } catch {
    return null
  }
}

/**
 * Parse involved players string into array of user info
 */
async function parseInvolvedPlayers(playersStr: string | null): Promise<GalleryUserInfo[]> {
  if (!playersStr) return []
  
  const uuids = playersStr.split(',').map(s => s.trim()).filter(Boolean)
  const results: GalleryUserInfo[] = []
  
  for (const uuid of uuids) {
    const userInfo = await getUserInfo(uuid)
    if (userInfo) {
      results.push(userInfo)
    }
  }
  
  return results
}

/**
 * Convert database row to public gallery image
 */
async function toPublicImage(image: GalleryImage): Promise<GalleryImagePublic> {
  const ownerInfo = await getUserInfo(image.owner_uuid)
  const involvedPlayers = await parseInvolvedPlayers(image.involved_players)
  
  return {
    id: image.id,
    path: image.path,
    mime: image.mime,
    size: image.size,
    owner: ownerInfo || { uuid: image.owner_uuid, nickname: 'Unknown' },
    description: image.description,
    category: image.category,
    season: image.season,
    coord_x: image.coord_x,
    coord_y: image.coord_y,
    coord_z: image.coord_z,
    involved_players: involvedPlayers,
    status: image.status,
    created_at: image.created_at,
    updated_at: image.updated_at
  }
}

/**
 * Check if user can upload to gallery
 * Returns error message if not allowed, null if allowed
 */
export async function canUserUpload(uuid: string): Promise<string | null> {
  const banned = await isUserBanned(uuid)
  if (banned) {
    return 'Banned users cannot upload to gallery'
  }
  return null
}

/**
 * Create a new gallery image
 */
export async function createGalleryImage(
  data: Buffer,
  mime: string,
  dto: CreateGalleryImageDto
): Promise<GalleryImage> {
  const db = useSkinSQLite()
  const fileService = useFileService()
  
  // Check if user is banned
  const uploadError = await canUserUpload(dto.owner_uuid)
  if (uploadError) {
    throw createError({
      statusCode: 403,
      statusMessage: uploadError,
      data: { statusMessageRu: 'Забаненные пользователи не могут загружать изображения' }
    })
  }
  
  // Save file
  const extension = mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpg' : 'webp'
  const fileMeta = await fileService.saveFile(data, {
    subDir: 'gallery',
    extension
  })
  
  const id = uuidv4()
  const now = Math.floor(Date.now() / 1000)
  const normalizedOwner = normalizeUuid(dto.owner_uuid)
  
  db.prepare(`
    INSERT INTO gallery (
      id, path, mime, size, owner_uuid, description,
      status, created_at, updated_at, involved_players
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `).run(
    id,
    fileMeta.path,
    mime,
    data.length,
    normalizedOwner,
    dto.description || null,
    now,
    now,
    normalizedOwner // By default, owner is the only involved player
  )
  
  return getGalleryImage(id)
}

/**
 * Get gallery image by ID
 */
export function getGalleryImage(id: string): GalleryImage {
  const db = useSkinSQLite()
  const image = db.prepare('SELECT * FROM gallery WHERE id = ?').get(id) as GalleryImage | undefined
  
  if (!image) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found',
      data: { statusMessageRu: 'Изображение не найдено' }
    })
  }
  
  return image
}

/**
 * Get gallery image with public user info
 */
export async function getGalleryImagePublic(id: string): Promise<GalleryImagePublic> {
  const image = getGalleryImage(id)
  return toPublicImage(image)
}

/**
 * Check if user can view image
 */
export function canViewImage(image: GalleryImage, userUuid: string | null, isAdmin: boolean): boolean {
  // Approved images are visible to everyone
  if (image.status === 'approved') return true
  
  // Pending/rejected images visible only to owner and admins
  if (isAdmin) return true
  if (userUuid && normalizeUuid(userUuid) === normalizeUuid(image.owner_uuid)) return true
  
  return false
}

/**
 * List gallery images with filters and pagination
 */
export async function listGalleryImages(
  filters: GalleryListFilters,
  page: number = 1,
  perPage: number = 20,
  includeFullObjects: boolean = true
): Promise<PaginatedResponse<GalleryImagePublic | string>> {
  const db = useSkinSQLite()
  
  let whereClauses: string[] = []
  let params: any[] = []
  
  // Only show approved images by default
  if (filters.status) {
    whereClauses.push('status = ?')
    params.push(filters.status)
  } else {
    whereClauses.push("status = 'approved'")
  }
  
  if (filters.category) {
    whereClauses.push('category = ?')
    params.push(filters.category)
  }
  
  if (filters.season) {
    whereClauses.push('season = ?')
    params.push(filters.season)
  }
  
  if (filters.owner_uuid) {
    whereClauses.push('owner_uuid = ?')
    params.push(normalizeUuid(filters.owner_uuid))
  }
  
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
  
  // Get total count
  const countResult = db.prepare(`SELECT COUNT(*) as count FROM gallery ${whereClause}`).get(...params) as { count: number }
  const total = countResult.count
  
  // Calculate pagination
  const totalPages = Math.ceil(total / perPage)
  const offset = (page - 1) * perPage
  
  // Get items
  const rows = db.prepare(`
    SELECT * FROM gallery ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, perPage, offset) as GalleryImage[]
  
  let items: (GalleryImagePublic | string)[]
  
  if (includeFullObjects) {
    items = await Promise.all(rows.map(toPublicImage))
  } else {
    items = rows.map(r => r.id)
  }
  
  return {
    items,
    total,
    page,
    perPage,
    totalPages
  }
}

/**
 * List pending images for admin review
 */
export async function listPendingImages(
  page: number = 1,
  perPage: number = 20
): Promise<PaginatedResponse<GalleryImagePublic>> {
  const result = await listGalleryImages(
    { status: 'pending' },
    page,
    perPage,
    true
  )
  return result as PaginatedResponse<GalleryImagePublic>
}

/**
 * List user's own images
 */
export async function listUserImages(
  userUuid: string,
  page: number = 1,
  perPage: number = 20
): Promise<PaginatedResponse<GalleryImagePublic>> {
  const db = useSkinSQLite()
  const normalizedUuid = normalizeUuid(userUuid)
  
  // Get total count
  const countResult = db.prepare('SELECT COUNT(*) as count FROM gallery WHERE owner_uuid = ?').get(normalizedUuid) as { count: number }
  const total = countResult.count
  
  // Calculate pagination
  const totalPages = Math.ceil(total / perPage)
  const offset = (page - 1) * perPage
  
  // Get items
  const rows = db.prepare(`
    SELECT * FROM gallery WHERE owner_uuid = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(normalizedUuid, perPage, offset) as GalleryImage[]
  
  const items = await Promise.all(rows.map(toPublicImage))
  
  return {
    items,
    total,
    page,
    perPage,
    totalPages
  }
}

/**
 * Update gallery image by owner (only description)
 */
export async function updateGalleryImageByOwner(
  id: string,
  ownerUuid: string,
  dto: UpdateGalleryImageOwnerDto
): Promise<GalleryImagePublic> {
  const db = useSkinSQLite()
  const image = getGalleryImage(id)
  
  // Verify ownership
  if (normalizeUuid(image.owner_uuid) !== normalizeUuid(ownerUuid)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Not authorized to edit this image',
      data: { statusMessageRu: 'Нет прав для редактирования этого изображения' }
    })
  }
  
  const now = Math.floor(Date.now() / 1000)
  
  if (dto.description !== undefined) {
    db.prepare('UPDATE gallery SET description = ?, updated_at = ? WHERE id = ?')
      .run(dto.description, now, id)
  }
  
  return getGalleryImagePublic(id)
}

/**
 * Update gallery image by admin (all fields)
 */
export async function updateGalleryImageByAdmin(
  id: string,
  dto: UpdateGalleryImageAdminDto
): Promise<GalleryImagePublic> {
  const db = useSkinSQLite()
  const image = getGalleryImage(id) // Verify exists
  
  const updates: string[] = []
  const params: any[] = []
  
  if (dto.description !== undefined) {
    updates.push('description = ?')
    params.push(dto.description)
  }
  
  if (dto.category !== undefined) {
    updates.push('category = ?')
    params.push(dto.category)
  }
  
  if (dto.season !== undefined) {
    updates.push('season = ?')
    params.push(dto.season)
  }
  
  if (dto.coord_x !== undefined) {
    updates.push('coord_x = ?')
    params.push(dto.coord_x)
  }
  
  if (dto.coord_y !== undefined) {
    updates.push('coord_y = ?')
    params.push(dto.coord_y)
  }
  
  if (dto.coord_z !== undefined) {
    updates.push('coord_z = ?')
    params.push(dto.coord_z)
  }
  
  if (dto.involved_players !== undefined) {
    updates.push('involved_players = ?')
    params.push(dto.involved_players)
  }
  
  if (updates.length > 0) {
    const now = Math.floor(Date.now() / 1000)
    updates.push('updated_at = ?')
    params.push(now)
    params.push(id)
    
    db.prepare(`UPDATE gallery SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  }
  
  return getGalleryImagePublic(id)
}

/**
 * Approve gallery image
 */
export async function approveGalleryImage(id: string): Promise<GalleryImagePublic> {
  const db = useSkinSQLite()
  const now = Math.floor(Date.now() / 1000)
  
  const result = db.prepare("UPDATE gallery SET status = 'approved', updated_at = ? WHERE id = ?").run(now, id)
  
  if (result.changes === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found',
      data: { statusMessageRu: 'Изображение не найдено' }
    })
  }
  
  return getGalleryImagePublic(id)
}

/**
 * Reject gallery image
 */
export async function rejectGalleryImage(id: string): Promise<GalleryImagePublic> {
  const db = useSkinSQLite()
  const now = Math.floor(Date.now() / 1000)
  
  const result = db.prepare("UPDATE gallery SET status = 'rejected', updated_at = ? WHERE id = ?").run(now, id)
  
  if (result.changes === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found',
      data: { statusMessageRu: 'Изображение не найдено' }
    })
  }
  
  return getGalleryImagePublic(id)
}

/**
 * Delete gallery image permanently
 */
export async function deleteGalleryImage(id: string): Promise<boolean> {
  const db = useSkinSQLite()
  const fileService = useFileService()
  
  const image = getGalleryImage(id)
  
  // Delete file
  await fileService.deleteFile(image.path)
  
  // Delete from database
  db.prepare('DELETE FROM gallery WHERE id = ?').run(id)
  
  return true
}

/**
 * Get all unique categories from gallery
 */
export function getGalleryCategories(): string[] {
  const db = useSkinSQLite()
  const rows = db.prepare(`
    SELECT DISTINCT category FROM gallery 
    WHERE category IS NOT NULL AND category != '' AND status = 'approved'
    ORDER BY category
  `).all() as { category: string }[]
  
  return rows.map(r => r.category)
}

/**
 * Get all unique seasons from gallery
 */
export function getGallerySeasons(): string[] {
  const db = useSkinSQLite()
  const rows = db.prepare(`
    SELECT DISTINCT season FROM gallery 
    WHERE season IS NOT NULL AND season != '' AND status = 'approved'
    ORDER BY season
  `).all() as { season: string }[]
  
  return rows.map(r => r.season)
}
