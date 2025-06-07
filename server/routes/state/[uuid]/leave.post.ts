export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const { playerUuid } = await readBody(event)
    await leaveState(stateUuid, playerUuid)
    return { ok: true }
})
