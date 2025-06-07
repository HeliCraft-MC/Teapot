export default defineEventHandler(async (event) => {
    const cityUuid = getRouterParam(event, 'uuid')
    await detachCityFromState(cityUuid)
    return { ok: true }
})
