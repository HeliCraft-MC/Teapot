/**
 * Status of gallery image in moderation workflow
 */
export type GalleryImageStatus = 'pending' | 'approved' | 'rejected'

/**
 * Gallery image metadata stored in database
 */
export interface GalleryImage {
  /** Unique image ID (UUID) */
  id: string
  /** Relative path to the image file */
  path: string
  /** MIME type of the image */
  mime: string
  /** File size in bytes */
  size: number
  /** Owner's UUID */
  owner_uuid: string
  /** Image description (editable by owner and admin) */
  description: string | null
  /** Category for filtering (set by admin) */
  category: string | null
  /** Season for filtering (set by admin) */
  season: string | null
  /** X coordinate in game (set by admin) */
  coord_x: number | null
  /** Y coordinate in game (set by admin) */
  coord_y: number | null
  /** Z coordinate in game (set by admin) */
  coord_z: number | null
  /** Comma-separated UUIDs of involved players (set by admin) */
  involved_players: string | null
  /** Moderation status */
  status: GalleryImageStatus
  /** Unix timestamp of upload */
  created_at: number
  /** Unix timestamp of last update */
  updated_at: number
}

/**
 * Public user info for gallery responses
 */
export interface GalleryUserInfo {
  uuid: string
  nickname: string
}

/**
 * Gallery image with resolved user info
 */
export interface GalleryImagePublic {
  id: string
  path: string
  mime: string
  size: number
  owner: GalleryUserInfo
  description: string | null
  category: string | null
  season: string | null
  coord_x: number | null
  coord_y: number | null
  coord_z: number | null
  involved_players: GalleryUserInfo[]
  status: GalleryImageStatus
  created_at: number
  updated_at: number
}

/**
 * DTO for creating a new gallery image
 */
export interface CreateGalleryImageDto {
  owner_uuid: string
  description?: string
}

/**
 * DTO for updating gallery image (by owner)
 */
export interface UpdateGalleryImageOwnerDto {
  description?: string
}

/**
 * DTO for updating gallery image (by admin)
 */
export interface UpdateGalleryImageAdminDto {
  description?: string
  category?: string
  season?: string
  coord_x?: number
  coord_y?: number
  coord_z?: number
  involved_players?: string
}

/**
 * Query filters for gallery listing
 */
export interface GalleryListFilters {
  category?: string
  season?: string
  owner_uuid?: string
  status?: GalleryImageStatus
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
