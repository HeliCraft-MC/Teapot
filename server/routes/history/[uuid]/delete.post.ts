export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const { deletedByUuid } = await readBody(event)
    await softDeleteHistoryEvent(uuid, deletedByUuid)
    return { ok: true }
})
