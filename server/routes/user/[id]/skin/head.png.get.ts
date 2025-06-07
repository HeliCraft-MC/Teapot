defineRouteMeta({
  openAPI: {
    tags: ['user'],
    description: 'Alias for head PNG',
    parameters: [
      { in: 'path', name: 'id', required: true }
    ],
    responses: {
      200: { description: 'Head PNG' },
      400: { description: 'Invalid id' },
      404: { description: 'Skin not found' }
    }
  }
})

export { default } from './head.get'