export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const a = String(query.stateUuidA)
    const b = String(query.stateUuidB)
    return await getRelation(a, b)
})
