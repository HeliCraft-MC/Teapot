import {isPlayerRulerSomewhere} from "~/utils/states/citizenship.utils";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const uuid = await resolveUuid(id, false)
    const user = await getUserByUUID(uuid)
    if (!user) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
            data: { statusMessageRu: 'Пользователь не найден' }
        })
    }

    return await isDiplomaticActionsAllowedForPlayer(uuid)
})
