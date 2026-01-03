import { deleteGalleryImage } from '~/utils/gallery.utils'
import { isUserAdmin } from '~/utils/user.utils'

defineRouteMeta({
  openAPI: {
    tags: ['gallery'],
    description: 'Delete gallery image permanently (Admin only)',
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Gallery image ID', schema: { type: 'string' } }
    ],
    responses: {
      200: {
        description: 'Image deleted successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ok: { type: 'boolean' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden - Admin only' },
      404: { description: 'Image not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const userUuid = event.context.auth?.uuid
  if (!userUuid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Check admin permissions
  const admin = await isUserAdmin(userUuid)
  if (!admin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: { statusMessageRu: 'Только для администраторов' }
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  await deleteGalleryImage(id)

  return {
    ok: true,
    message: 'Image deleted successfully'
  }
})
