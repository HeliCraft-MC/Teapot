import {searchUsers} from "~/utils/user.utils";

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const nickname = query.nickname ? String(query.nickname) : undefined
    const startAt = query.startAt ? Number(query.startAt) : undefined
    const limit = query.limit ? Number(query.limit) : undefined
    if (!nickname) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Nickname query parameter is required'
        })
    }
    return await searchUsers(nickname, startAt, limit)
})