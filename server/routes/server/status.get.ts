defineRouteMeta({
  openAPI: {
    tags: ['server'],
    description: 'Get current game server status',
      responses: {
        200: {
          description: 'Status info',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  playersOnline: { type: 'array', items: { type: 'string' } },
                  playersMax: { type: 'number' }
                }
              }
            }
          }
        },
        500: { description: 'Server error' }
      }
  }
})

interface ServerResponse {
    status: boolean;
    count: number;
    players: string[];
    maxPlayersCount: number;
}

export default defineEventHandler(async (event) => {
    try {
        let playersOnline
        let playersMax

        const data = await $fetch<ServerResponse>('http://localhost:5123/open/getPlayersCount', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            parseResponse: JSON.parse
        }).catch((e) => {
            console.log('Error fetching data from server:', e)
            playersOnline = []
            playersMax = 0
        })
        if (data && data.players && data.maxPlayersCount) {
            playersOnline = data.players
            playersMax = data.maxPlayersCount
        } else {
            playersOnline = []
            playersMax = 0
        }

        return {
            playersOnline,
            playersMax
        }

    } catch (e) {
        console.log('Error fetching data from server:', e)
        throw createError({
            statusCode: 500,
            statusMessage: 'Server error',
            data: {
                statusMessageRu: 'Ошибка сервера',
                error: e
            }
        })
    }
})