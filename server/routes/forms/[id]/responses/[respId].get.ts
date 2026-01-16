defineRouteMeta({
  openAPI: {
    tags: ['analytics'],
    description: 'Детали конкретного ответа',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } },
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' }
      },
      {
        name: 'respId',
        in: 'path',
        required: true,
        schema: { type: 'string' }
      }
    ],
    responses: {
      200: {
        description: 'Детали ответа',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                form_id: { type: 'string' },
                answers: { type: 'array', items: { type: 'object' } }
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
  const respId = getRouterParam(event, 'respId');
  // TODO: Get specific response details
  // GET /api/v1/forms/:id/responses/:respId -> /forms/:id/responses/:respId
  return {
    id: respId,
    form_id: id,
    answers: []
  };
});
