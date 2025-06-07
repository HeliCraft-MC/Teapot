export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const uuid = await createAlliance(body.creatorStateUuid, body.creatorPlayerUuid, body.name, body.description, body.purpose, body.colorHex, body.flagLink)
    return { uuid }
})
