export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    return await getWarByUuid(warUuid)
})
