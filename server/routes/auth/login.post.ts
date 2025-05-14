
export default defineEventHandler(async (event) => {
    const { nickname, password } = await readBody(event)

    try {
        const { tokens, uuid, nickname: userNickname } = await loginUser(nickname, password)
        setCookie(event, 'refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure:   true,
            sameSite: 'lax',
            maxAge:   7 * 24 * 60 * 60
        })
        return {
            uuid,
            nickname: userNickname
        }
    } catch (e) {
        throw e;
    }


})