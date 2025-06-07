export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const { applicantUuid, reviewerUuid, approve } = await readBody(event)
    await reviewMembershipApplication(stateUuid, applicantUuid, reviewerUuid, approve)
    return { ok: true }
})
