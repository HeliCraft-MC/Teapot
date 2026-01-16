defineRouteMeta({
  openAPI: {
    tags: ['analytics'],
    description: 'Агрегированная статистика',
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
        description: 'Статистика формы',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                form_id: { type: 'string' },
                total_responses: { type: 'integer' },
                views: { type: 'integer' }
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
  // TODO: Get form statistics
  // GET /api/v1/forms/:id/stats -> /forms/:id/stats
  return {
    form_id: id,
    total_responses: 0,
    views: 0
  };
});
