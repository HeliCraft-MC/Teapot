export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    const { adminUuid } = await readBody(event)
    await scheduleWar(warUuid, adminUuid)
    return { ok: true }
})
