import { getGalleryCategories } from '~/utils/gallery.utils'

defineRouteMeta({
  openAPI: {
    tags: ['gallery'],
    description: 'Get all unique categories from approved gallery images',
    responses: {
      200: {
        description: 'List of unique categories',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                categories: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
})

export default defineEventHandler(async () => {
  return {
    categories: getGalleryCategories()
  }
})
