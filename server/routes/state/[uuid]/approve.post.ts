export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const { adminUuid } = await readBody(event)
    await approveState(uuid, adminUuid)
    return { ok: true }
})
