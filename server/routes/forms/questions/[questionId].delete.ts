defineRouteMeta({
  openAPI: {
    tags: ['questions'],
    description: 'Удалить вопрос',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } },
      {
        name: 'questionId',
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
  const questionId = getRouterParam(event, 'questionId');
  // TODO: Delete question
  // DELETE /api/v1/questions/:questionId -> /forms/questions/:questionId
  return {
    success: true,
    id: questionId
  };
});
