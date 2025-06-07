export default defineEventHandler(async (event) => {
    const cityUuid = getRouterParam(event, 'uuid')
    const { playerUuid } = await readBody(event)
    await detachPlayerFromCity(playerUuid)
    return { ok: true }
})
