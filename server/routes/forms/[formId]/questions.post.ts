import { QuestionDTO } from '../../types/forms.types';

defineRouteMeta({
  openAPI: {
    tags: ['questions'],
    description: 'Добавить новый вопрос',
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
              type: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              required: { type: 'boolean' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Созданный вопрос',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                form_id: { type: 'string' },
                type: { type: 'string' },
                title: { type: 'string' }
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
  const body = await readBody<Partial<QuestionDTO>>(event);
  // TODO: Add new question to form
  // POST /api/v1/forms/:formId/questions -> /forms/:formId/questions
  return {
    id: 'new-question-id',
    form_id: formId,
    ...body
  };
});
