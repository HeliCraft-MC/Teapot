defineRouteMeta({
  openAPI: {
    tags: ['user'],
    description: 'Alias for player skin PNG',
    parameters: [
      { in: 'path', name: 'id', required: true }
    ],
    responses: {
      200: {
        description: 'Skin file',
        content: {
          'image/png': { schema: { type: 'string', format: 'binary' } }
        }
      },
      400: { description: 'Invalid id' },
      404: { description: 'Skin not found' }
    }
  }
})

export { default } from './index.get'