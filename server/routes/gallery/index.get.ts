import { listGalleryImages } from '~/utils/gallery.utils'

defineRouteMeta({
  openAPI: {
    tags: ['gallery'],
    description: 'List approved gallery images with pagination and filters',
    parameters: [
      { name: 'page', in: 'query', description: 'Page number (default 1)', schema: { type: 'integer', minimum: 1 } },
      { name: 'perPage', in: 'query', description: 'Items per page (default 20, max 100)', schema: { type: 'integer', minimum: 1, maximum: 100 } },
      { name: 'category', in: 'query', description: 'Filter by category', schema: { type: 'string' } },
      { name: 'season', in: 'query', description: 'Filter by season', schema: { type: 'string' } }
    ],
    responses: {
      200: {
        description: 'List of approved gallery images',
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
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Math.max(1, parseInt(query.page as string) || 1)
  const perPage = Math.min(100, Math.max(1, parseInt(query.perPage as string) || 20))
  const category = query.category as string | undefined
  const season = query.season as string | undefined

  return await listGalleryImages(
    { 
      status: 'approved',
      category,
      season
    },
    page,
    perPage,
    true
  )
})
