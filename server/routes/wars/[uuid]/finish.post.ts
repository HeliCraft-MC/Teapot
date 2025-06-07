export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    const { result, resultAction, adminUuid } = await readBody(event)
    await finishWar(warUuid, result, resultAction, adminUuid)
    return { ok: true }
})
