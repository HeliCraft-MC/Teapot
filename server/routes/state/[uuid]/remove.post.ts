export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const { uuidToRemove, uuidWhoRemoved } = await readBody(event)
    await removeMember(stateUuid, uuidToRemove, uuidWhoRemoved)
    return { ok: true }
})
