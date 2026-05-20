defineRouteMeta({
  openAPI: {
    tags: ['forms'],
    description: 'Получить полную структуру формы для редактирования',
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
        description: 'Структура формы',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                theme: { type: 'string' },
                questions: { type: 'array', items: { type: 'object' } }
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
  // TODO: Get full form structure
  // GET /api/v1/forms/:id -> /forms/:id
  return {
    id: id,
    title: 'Form Title',
    description: 'Form Description',
    theme: 'default',
    questions: []
  };
});
