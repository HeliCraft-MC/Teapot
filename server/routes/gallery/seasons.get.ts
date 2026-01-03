import { getGallerySeasons } from '~/utils/gallery.utils'

defineRouteMeta({
  openAPI: {
    tags: ['gallery'],
    description: 'Get all unique seasons from approved gallery images',
    responses: {
      200: {
        description: 'List of unique seasons',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                seasons: {
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
    seasons: getGallerySeasons()
  }
})
