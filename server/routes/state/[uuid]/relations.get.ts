defineRouteMeta({
  openAPI: {
    tags: ['state'],
    description: 'List state relations',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
      responses: {
        200: {
          description: 'Relations list',
          content: {
          'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/IStateRelation' } }
          }
          }
        }
      }
  }
})

export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    return await getStateRelationsList(stateUuid)
})
