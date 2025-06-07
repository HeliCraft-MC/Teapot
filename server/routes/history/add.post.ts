export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const uuid = await addHistoryEvent(body)
    return { uuid }
})
