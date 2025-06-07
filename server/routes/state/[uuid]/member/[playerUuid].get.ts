export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const playerUuid = getRouterParam(event, 'playerUuid')
    return await getMember(stateUuid, playerUuid)
})
