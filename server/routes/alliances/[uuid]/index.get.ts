export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    return await getAllianceByUuid(allianceUuid)
})
