export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    return await getStateByUuid(uuid)
})
