export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const { adminUuid } = await readBody(event)
    await rejectState(uuid, adminUuid)
    return { ok: true }
})
