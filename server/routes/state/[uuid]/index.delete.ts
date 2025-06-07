export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const { adminUuid } = await readBody(event)
    await deleteState(uuid, adminUuid)
    return { ok: true }
})
