export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    const { defenderStateUuid, defenderPlayerUuid, accept } = await readBody(event)
    await respondWarDeclaration(warUuid, defenderStateUuid, defenderPlayerUuid, accept)
    return { ok: true }
})
