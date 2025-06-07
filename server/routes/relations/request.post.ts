export default defineEventHandler(async (event) => {
    const { proposerStateUuid, targetStateUuid, requestedKind, proposerPlayerUuid } = await readBody(event)
    const uuid = await requestRelationChange(proposerStateUuid, targetStateUuid, requestedKind, proposerPlayerUuid)
    return { uuid }
})
