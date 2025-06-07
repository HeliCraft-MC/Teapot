export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    await deleteCity(uuid)
    return { ok: true }
})
