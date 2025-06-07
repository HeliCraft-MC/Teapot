defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    description: 'Login a user',
    requestBody: {
      description: 'Nickname and password',
      required: true
    },
    responses: {
      200: { description: 'Login successful' },
      401: { description: 'Invalid password' },
      404: { description: 'User not found' }
    }
  }
})

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
            nickname: userNickname,
            accessToken: tokens.accessToken
        }
    } catch (e) {
        throw e
    }


})