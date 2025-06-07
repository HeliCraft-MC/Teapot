export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const { applicantUuid } = await readBody(event)
    await applyForMembership(stateUuid, applicantUuid)
    return { ok: true }
})
