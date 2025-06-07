export default defineEventHandler(async (event) => {
    const stateUuid = getRouterParam(event, 'uuid')
    const { playerUuid, updaterUuid, newRole } = await readBody(event)
    await updateMemberRole(stateUuid, playerUuid, updaterUuid, newRole)
    return { ok: true }
})
