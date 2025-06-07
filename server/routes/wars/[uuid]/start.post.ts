export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    const { adminUuid } = await readBody(event)
    await startWar(warUuid, adminUuid)
    return { ok: true }
})
