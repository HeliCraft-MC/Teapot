export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const body = await readBody(event)
    await updateHistoryEvent(uuid, body, body.updaterUuid)
    return { ok: true }
})
