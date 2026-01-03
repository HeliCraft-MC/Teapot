import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import type { H3Event } from 'h3'
import { createGalleryImage } from '~/utils/gallery.utils'

defineRouteMeta({
  openAPI: {
    tags: ['gallery'],
    description: 'Upload a new gallery image (requires authentication, banned users cannot upload)',
    security: [{ bearerAuth: [] }],
    requestBody: {
      description: 'Image file (PNG, JPEG, or WebP). Optionally include description in form field.',
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              file: { type: 'string', format: 'binary' },
              description: { type: 'string' }
            },
            required: ['file']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Image uploaded successfully (pending approval)',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ok: { type: 'boolean' },
                image: { $ref: '#/components/schemas/GalleryImage' }
              }
            }
          }
        }
      },
      400: { description: 'Invalid request' },
      401: { description: 'Unauthorized' },
      403: { description: 'User is banned' },
      413: { description: 'File too big' },
      415: { description: 'Unsupported media type' }
    }
  }
})

export default defineEventHandler(async (event: H3Event) => {
  // Get authenticated user
  const userUuid = event.context.auth?.uuid
  if (!userUuid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Parse multipart form
  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Empty upload' })
  }

  // Find file and description
  const filePart = parts.find(p => p.name === 'file' || !p.name)
  const descriptionPart = parts.find(p => p.name === 'description')

  if (!filePart?.data) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  // Limit size to 10 MB
  if (filePart.data.length > 10_485_760) {
    throw createError({ statusCode: 413, statusMessage: 'File too big (max 10MB)' })
  }

  // Check file type
  const ft = await fileTypeFromBuffer(filePart.data)
  if (!ft || !['image/png', 'image/jpeg', 'image/webp'].includes(ft.mime)) {
    throw createError({ statusCode: 415, statusMessage: 'Only PNG, JPEG, and WebP images are supported' })
  }

  // Process and optimize image
  let processedImage: Buffer
  try {
    processedImage = await sharp(filePart.data)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .toBuffer()
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image file' })
  }

  // Create gallery image
  const description = descriptionPart?.data?.toString('utf-8') || undefined

  const image = await createGalleryImage(processedImage, ft.mime, {
    owner_uuid: userUuid,
    description
  })

  return {
    ok: true,
    image
  }
})
