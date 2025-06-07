defineRouteMeta({
  openAPI: {
    tags: ['user'],
    description: 'Alias for player skin PNG',
    parameters: [
      { in: 'path', name: 'id', required: true }
    ],
    responses: {
      200: { description: 'Skin file' },
      400: { description: 'Invalid id' },
      404: { description: 'Skin not found' }
    }
  }
})

export { default } from './skin/index.get'
