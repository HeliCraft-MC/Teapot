defineRouteMeta({
  openAPI: {
    tags: ['forms'],
    description: 'Получить список всех форм пользователя',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    responses: {
      200: {
        description: 'Список форм',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'string' }
                }
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
  // TODO: Get list of forms for the authenticated user
  // GET /api/v1/forms -> /forms
  return [
    {
      id: '1',
      title: 'Untitled Form',
      status: 'draft'
    }
  ];
});
