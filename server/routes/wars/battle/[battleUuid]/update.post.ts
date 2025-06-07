export default defineEventHandler(async (event) => {
    const battleUuid = getRouterParam(event, 'battleUuid')
    const { status, updaterUuid, result, endDate } = await readBody(event)
    await updateBattleStatus(battleUuid, status, updaterUuid, result, endDate)
    return { ok: true }
})
