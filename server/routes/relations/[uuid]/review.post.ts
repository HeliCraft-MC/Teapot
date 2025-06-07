export default defineEventHandler(async (event) => {
    const requestUuid = getRouterParam(event, 'uuid')
    const { reviewerStateUuid, reviewerPlayerUuid, approve } = await readBody(event)
    await reviewRelationChange(requestUuid, reviewerStateUuid, reviewerPlayerUuid, approve)
    return { ok: true }
})
