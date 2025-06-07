export default defineEventHandler(async (event) => {
    const cityUuid = getRouterParam(event, 'uuid')
    await setCityAsCapital(cityUuid)
    return { ok: true }
})
