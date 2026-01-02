defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    description: 'Register a new user',
    requestBody: {
      description: 'Nickname and password',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              nickname: { type: 'string' },
              password: { type: 'string' }
            },
            required: ['nickname', 'password']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Registration successful',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                uuid: { type: 'string' },
                nickname: { type: 'string' },
                accessToken: { type: 'string' }
              }
            }
          }
        }
      },
      409: { description: 'Nickname already taken' },
      422: { description: 'Validation error (nickname or password too short)' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const { nickname, password } = await readBody(event)

    try {
        const { tokens, uuid, nickname: userNickname } = await registerUser(nickname, password)
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
