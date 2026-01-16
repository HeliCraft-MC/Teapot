import { SubmissionPayload } from '~/types/forms.types';

defineRouteMeta({
  openAPI: {
    tags: ['respondent'],
    description: 'Отправить ответы',
    parameters: [
      {
        name: 'hash',
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
              started_at: { type: 'string', format: 'date-time' },
              submitted_at: { type: 'string', format: 'date-time' },
              answers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question_id: { type: 'string' },
                    // @ts-ignore
                    value: {
                      oneOf: [
                        { type: 'string' },
                        { type: 'number' },
                        { type: 'array', items: { type: 'string' } }
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Результат отправки',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                submission_id: { type: 'string' }
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
  const body = await readBody<SubmissionPayload>(event);
  // TODO: Submit form response
  // POST /api/v1/public/forms/:hash/submit -> /forms/public/:hash/submit
  return {
    success: true,
    submission_id: 'new-submission-id'
  };
});
