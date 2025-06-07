export default defineEventHandler(async (event) => {
    const { name, coordinates, stateUuid, isCapital } = await readBody(event)
    await createCity(name, coordinates, stateUuid, isCapital)
    return { ok: true }
})
