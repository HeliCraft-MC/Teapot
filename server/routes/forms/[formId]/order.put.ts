defineRouteMeta({
  openAPI: {
    tags: ['questions'],
    description: 'Изменить порядок вопросов',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } },
      {
        name: 'formId',
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
              questionIds: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['questionIds']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Новый порядок вопросов',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                form_id: { type: 'string' },
                order: { type: 'array', items: { type: 'string' } }
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
  const formId = getRouterParam(event, 'formId');
  const body = await readBody<{ questionIds: string[] }>(event);
  // TODO: Reorder questions
  // PUT /api/v1/forms/:formId/order -> /forms/:formId/order
  return {
    success: true,
    form_id: formId,
    order: body.questionIds
  };
});
