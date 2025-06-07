export default defineEventHandler(async (event) => {
    const uuid = getRouterParam(event, 'uuid')
    const body = await readBody(event)
    await updateCity(uuid, body.name, body.coordinates, body.stateUuid, body.isCapital)
    return { ok: true }
})
