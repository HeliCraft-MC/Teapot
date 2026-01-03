import {
  getGalleryImage,
  updateGalleryImageByOwner,
  updateGalleryImageByAdmin
} from '~/utils/gallery.utils'
import { isUserAdmin } from '~/utils/user.utils'

defineRouteMeta({
  openAPI: {
    tags: ['gallery'],
    description: 'Update gallery image. Users can update description only. Admins can update all fields.',
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Gallery image ID', schema: { type: 'string' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              description: { type: 'string', description: 'Image description (owner or admin)' },
              category: { type: 'string', description: 'Category (admin only)' },
              season: { type: 'string', description: 'Season (admin only)' },
              coord_x: { type: 'integer', description: 'X coordinate in game (admin only)' },
              coord_y: { type: 'integer', description: 'Y coordinate in game (admin only)' },
              coord_z: { type: 'integer', description: 'Z coordinate in game (admin only)' },
              involved_players: { type: 'string', description: 'Comma-separated UUIDs of involved players (admin only)' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Updated gallery image',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GalleryImagePublic' }
          }
        }
      },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden - Not authorized to edit this image' },
      404: { description: 'Image not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const userUuid = event.context.auth?.uuid
  if (!userUuid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const body = await readBody(event)
  const image = getGalleryImage(id)
  const admin = await isUserAdmin(userUuid)

  // Normalize UUIDs for comparison
  const normalizedUserUuid = userUuid.replace(/-/g, '').toLowerCase()
  const normalizedOwnerUuid = image.owner_uuid.replace(/-/g, '').toLowerCase()
  const isOwner = normalizedUserUuid === normalizedOwnerUuid

  if (!isOwner && !admin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Not authorized to edit this image',
      data: { statusMessageRu: 'Нет прав для редактирования этого изображения' }
    })
  }

  if (admin) {
    // Admin can update all fields
    // Validate and parse coordinates
    let coord_x: number | undefined
    let coord_y: number | undefined
    let coord_z: number | undefined
    
    if (body.coord_x !== undefined) {
      coord_x = parseInt(body.coord_x)
      if (isNaN(coord_x)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid coord_x value' })
      }
    }
    if (body.coord_y !== undefined) {
      coord_y = parseInt(body.coord_y)
      if (isNaN(coord_y)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid coord_y value' })
      }
    }
    if (body.coord_z !== undefined) {
      coord_z = parseInt(body.coord_z)
      if (isNaN(coord_z)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid coord_z value' })
      }
    }

    return await updateGalleryImageByAdmin(id, {
      description: body.description,
      category: body.category,
      season: body.season,
      coord_x,
      coord_y,
      coord_z,
      involved_players: body.involved_players
    })
  } else {
    // Owner can only update description
    return await updateGalleryImageByOwner(id, userUuid, {
      description: body.description
    })
  }
})
