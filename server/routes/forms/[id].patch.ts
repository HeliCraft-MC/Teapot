defineRouteMeta({
  openAPI: {
    tags: ['forms'],
    description: 'Обновить мета-данные формы',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } },
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' }
      }
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              theme: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Обновленная форма',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                theme: { type: 'string' }
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
  const body = await readBody(event);
  // TODO: Update form metadata
  // PATCH /api/v1/forms/:id -> /forms/:id
  return {
    id: id,
    ...body
  };
});
