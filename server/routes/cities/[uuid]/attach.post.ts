export default defineEventHandler(async (event) => {
    const cityUuid = getRouterParam(event, 'uuid')
    const { stateUuid } = await readBody(event)
    await attachCityToState(cityUuid, stateUuid)
    return { ok: true }
})
