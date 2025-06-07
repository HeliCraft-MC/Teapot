export default defineEventHandler(async (event) => {
    const allianceUuid = getRouterParam(event, 'uuid')
    const { applicantStateUuid, approverStateUuid, approverPlayerUuid, approve } = await readBody(event)
    await reviewAllianceJoin(allianceUuid, applicantStateUuid, approverStateUuid, approverPlayerUuid, approve)
    return { ok: true }
})
