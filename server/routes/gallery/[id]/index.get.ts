import { getGalleryImage, getGalleryImagePublic, canViewImage } from '~/utils/gallery.utils'
import { isUserAdmin } from '~/utils/user.utils'

defineRouteMeta({
  openAPI: {
    tags: ['gallery'],
    description: 'Get gallery image details. Approved images are public, pending/rejected only visible to owner and admins.',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Gallery image ID', schema: { type: 'string' } }
    ],
    responses: {
      200: {
        description: 'Gallery image details',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GalleryImagePublic' }
          }
        }
      },
      403: { description: 'Forbidden - Cannot view this image' },
      404: { description: 'Image not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const image = getGalleryImage(id)
  
  // Check view permissions
  const userUuid = event.context.auth?.uuid || null
  const admin = userUuid ? await isUserAdmin(userUuid) : false

  if (!canViewImage(image, userUuid, admin)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot view this image',
      data: { statusMessageRu: 'Нет доступа к этому изображению' }
    })
  }

  return await getGalleryImagePublic(id)
})
