import {refreshUser} from "~/utils/auth.utils";


export default defineEventHandler(async (event) => {
    const { nickname, refreshToken } = await readBody(event)

    try {
        const { tokens, uuid, nickname: userNickname } = await refreshUser(nickname, refreshToken)
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