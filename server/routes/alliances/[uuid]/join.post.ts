export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    const { stateUuid, playerUuid } = await readBody(event)
    await requestAllianceJoin(allianceUuid, stateUuid, playerUuid)
    return { ok: true }
})
