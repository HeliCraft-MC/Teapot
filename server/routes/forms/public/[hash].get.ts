defineRouteMeta({
  openAPI: {
    tags: ['respondent'],
    description: 'Получить структуру формы для рендера',
    parameters: [
      {
        name: 'hash',
        in: 'path',
        required: true,
        schema: { type: 'string' }
      }
    ],
    responses: {
      200: {
        description: 'Публичная структура формы',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                hash: { type: 'string' },
                title: { type: 'string' },
                questions: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event) => {
  const hash = getRouterParam(event, 'hash');
  // TODO: Get public form structure by hash
  // GET /api/v1/public/forms/:hash -> /forms/public/:hash
  return {
    hash: hash,
    title: 'Public Form',
    questions: []
  };
});
