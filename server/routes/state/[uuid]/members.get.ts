export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    return await getStateMembers(uuid)
})
