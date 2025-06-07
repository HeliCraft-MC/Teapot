export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    return await getCityByUuid(uuid)
})
