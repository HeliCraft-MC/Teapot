export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    return await listPendingRelationRequests(stateUuid)
})
