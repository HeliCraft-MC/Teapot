defineRouteMeta({
  openAPI: {
    tags: ['forms'],
    description: 'Удалить форму (soft delete)',
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
        description: 'Результат удаления',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                id: { type: 'string' }
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
  // TODO: Soft delete form
  // DELETE /api/v1/forms/:id -> /forms/:id
  return {
    success: true,
    id: id
  };
});
