defineRouteMeta({
  openAPI: {
    tags: ['general'],
    description: 'Default landing route',
    responses: {
      200: {
        description: 'Greeting message',
        content: {
          'text/plain': { schema: { type: 'string' } }
        }
      }
    }
  }
})

export default defineEventHandler((event) => {
  return "Start by editing <code>server/routes/index.ts</code>.";
});
