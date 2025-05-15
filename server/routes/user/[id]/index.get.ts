import {H3Error} from "h3";

/**
 * GET /user/[id]
 * Возвращает публичные поля пользователя: uuid, nickname, regDate, loginDate.
 * Параметр [id] может быть либо UUID, либо никнеймом (регистр не учитывается).
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const uuid = await resolveUuid(id)
    const user = await getUserByUUID(uuid)
    if (!user) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
            data: { statusMessageRu: 'Пользователь не найден' }
        })
    }
    // Возвращаем только публичные поля
    return toPublicUser(user)
})
