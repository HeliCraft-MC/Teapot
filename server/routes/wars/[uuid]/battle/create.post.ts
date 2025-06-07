export default defineEventHandler(async (event) => {
    const warUuid = getRouterParam(event, 'uuid')
    const { creatorStateUuid, creatorPlayerUuid, name, description, type, startDate } = await readBody(event)
    const uuid = await createBattle(warUuid, creatorStateUuid, creatorPlayerUuid, name, description, type, startDate)
    return { uuid }
})
