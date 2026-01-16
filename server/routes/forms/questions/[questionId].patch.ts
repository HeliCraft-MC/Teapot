import {QuestionDTO} from "~/types/forms.types";

defineRouteMeta({
  openAPI: {
    tags: ['questions'],
    description: 'Изменить вопрос',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } },
      {
        name: 'questionId',
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
              type: { type: 'string' },
              options: { type: 'array', items: { type: 'object' } },
              validation: { type: 'object' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Обновленный вопрос',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
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
  const questionId = getRouterParam(event, 'questionId');
  const body = await readBody<Partial<QuestionDTO>>(event);
  // TODO: Update question
  // PATCH /api/v1/questions/:questionId -> /forms/questions/:questionId
  return {
    id: questionId,
    ...body
  };
});
