defineRouteMeta({
  openAPI: {
    tags: ['analytics'],
    description: 'Скачать ответы в CSV/Excel',
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
        description: 'CSV файл с ответами',
        content: {
          'text/csv': {
            schema: {
              type: 'string',
              format: 'binary'
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
  // TODO: Export responses as CSV
  // GET /api/v1/forms/:id/export/csv -> /forms/:id/export/csv
  setResponseHeader(event, 'Content-Type', 'text/csv');
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="form-${id}-responses.csv"`);
  return 'id,submitted_at,answer1,answer2\n';
});
