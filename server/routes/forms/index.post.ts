defineRouteMeta({
  openAPI: {
    tags: ['forms'],
    description: 'Создать новую пустую форму',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } }
    ],
    responses: {
      200: {
        description: 'Созданная форма',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                status: { type: 'string' },
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
  // TODO: Create a new empty form
  // POST /api/v1/forms -> /forms
  return {
    id: 'new-form-id',
    title: 'New Form',
    status: 'draft',
    questions: []
  };
});
