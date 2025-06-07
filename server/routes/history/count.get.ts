export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    return await countHistoryEvents(query as any)
})
