defineRouteMeta({
  openAPI: {
    tags: ['forms'],
    description: 'Опубликовать форму',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } },
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' }
      }
    ],
    responses: {
      200: {
        description: 'Результат публикации',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                public_hash: { type: 'string' },
                published_at: { type: 'string' }
              }
            }
          }
        }
      },
      401: { description: 'Unauthenticated' }
    }
  }
});

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  // TODO: Publish form (generate snapshot)
  // POST /api/v1/forms/:id/publish -> /forms/:id/publish
  return {
    success: true,
    public_hash: 'generated-hash',
    published_at: new Date().toISOString()
  };
});
