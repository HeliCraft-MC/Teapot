defineRouteMeta({
  openAPI: {
    tags: ['wars'],
    description: 'Respond to a war declaration',
    parameters: [
      { in: 'path', name: 'uuid', required: true }
    ],
    requestBody: {
      description: 'Defender info and decision',
      required: true
    },
    responses: {
      200: { description: 'Decision recorded' },
      400: { description: 'War already processed' },
      403: { description: 'Not authorized' },
      404: { description: 'Defender not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    const { defenderStateUuid, defenderPlayerUuid, accept } = await readBody(event)
    await respondWarDeclaration(warUuid, defenderStateUuid, defenderPlayerUuid, accept)
    return { ok: true }
})
