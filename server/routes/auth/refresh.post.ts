defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    description: 'Refresh authentication tokens',
    requestBody: {
      description: 'User UUID',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { uuid: { type: 'string' } },
            required: ['uuid']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Tokens refreshed',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                uuid: { type: 'string' },
                nickname: { type: 'string' }
              }
            }
          }
        }
      },
      401: { description: 'Invalid refresh token' },
      404: { description: 'User not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
    const { uuid } = await readBody(event)
    const refreshToken = getCookie(event, 'refreshToken')

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