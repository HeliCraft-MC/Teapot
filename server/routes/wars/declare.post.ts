export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const uuid = await declareWar(body.attackerStateUuid, body.defenderStateUuid, body.attackerPlayerUuid, body.name, body.reason, body.victoryCondition)
    return { uuid }
})
