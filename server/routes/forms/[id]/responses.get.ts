defineRouteMeta({
  openAPI: {
    tags: ['analytics'],
    description: 'Список всех ответов (пагинация)',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } },
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' }
      },
      {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1 }
      },
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 20 }
      }
    ],
    responses: {
      200: {
        description: 'Список ответов',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: { type: 'array', items: { type: 'object' } },
                total: { type: 'integer' },
                page: { type: 'integer' }
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
  // TODO: Get list of responses for form
  // GET /api/v1/forms/:id/responses -> /forms/:id/responses
  return {
    data: [],
    total: 0,
    page: 1
  };
});
