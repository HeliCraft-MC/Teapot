import { listUserImages } from '~/utils/gallery.utils'

defineRouteMeta({
  openAPI: {
    tags: ['gallery'],
    description: 'List current user\'s own gallery images (all statuses)',
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'page', in: 'query', description: 'Page number (default 1)', schema: { type: 'integer', minimum: 1 } },
      { name: 'perPage', in: 'query', description: 'Items per page (default 20, max 100)', schema: { type: 'integer', minimum: 1, maximum: 100 } }
    ],
    responses: {
      200: {
        description: 'List of user\'s gallery images',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/GalleryImagePublic' }
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                perPage: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        }
      },
      401: { description: 'Unauthorized' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const userUuid = event.context.auth?.uuid
  if (!userUuid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)

  const page = Math.max(1, parseInt(query.page as string) || 1)
  const perPage = Math.min(100, Math.max(1, parseInt(query.perPage as string) || 20))

  return await listUserImages(userUuid, page, perPage)
})
