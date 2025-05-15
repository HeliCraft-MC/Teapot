export default defineEventHandler(async (event) => {
    const { uuid, refreshToken } = await readBody(event)

    try {
        const { tokens, uuid: newUuid, nickname: userNickname } = await refreshUser(uuid, refreshToken)
        setCookie(event, 'refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure:   true,
            sameSite: 'lax',
            maxAge:   7 * 24 * 60 * 60
        })
        return {
            accessToken: tokens.accessToken,
            uuid: newUuid,
            nickname: userNickname
        }
    } catch (e) {
        throw e;
    }
})