export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    const { byPlayerUuid, stateUuid } = await readBody(event)
    await dissolveAlliance(allianceUuid, byPlayerUuid, stateUuid)
    return { ok: true }
})
