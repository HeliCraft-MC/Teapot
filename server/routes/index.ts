defineRouteMeta({
  openAPI: {
    tags: ['general'],
    description: 'Default landing route',
    responses: {
      200: {
        description: 'Успешный ответ с приветственным сообщением, коммитом и временной меткой',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Teapot - helicraft backend application.' },
                commit: { type: 'string', example: 'abcdef123456' },
                timestamp: { type: 'integer', example: 1717777777777 }
              }
            }
          }
        }
      }
    }
  }
})

export default defineEventHandler((event) => {
  return {
    message: 'Teapot - helicraft backend application.',
    commit: useRuntimeConfig().teapotCommit,
    timestamp: Date.now()
  };
});
