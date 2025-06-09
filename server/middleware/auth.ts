// server/middleware/auth.ts

/* ---------- правила исключений ---------- */
interface ExcludeRule {
    pattern: RegExp
    methods?: string[]        // UPPER-case
}
const exclude: ExcludeRule[] = [
    { pattern: /^\/auth\/login(?:\?.*)?$/ },
    { pattern: /^\/auth\/refresh$/ },
    { pattern: /^\/auth\/logout$/ },
    { pattern: /^\/user\/[^/]+\/skin(?:\/head)?(?:\.png)?$/, methods: ['GET'] },
    { pattern: /^\/$/ },
    { pattern: /^\/_scalar$/ },
    { pattern: /^\/_swagger$/ },
    { pattern: /^\/_openapi\.json$/ },
    { pattern: /^\/state\/list$/ },
    { pattern: /^\/state\/search$/ },
    { pattern: /^\/server\/status$/ },
    { pattern: /^\/flags(\/.*)?$/ },
]

export default defineEventHandler(async (event) => {
    const url    = event.path || event.node.req.url || '/'
    const method = (event.method || event.node.req.method || 'GET').toUpperCase()

    /* 1. исключаем public-роуты */
    for (const rule of exclude) {
        if (rule.pattern.test(url) &&
            (!rule.methods || rule.methods.includes(method))) {
            return
        }
    }

    /* 2. Bearer */
    // Сначала пробуем получить токен из куки
    const cookies = parseCookies(event)
    let accessToken = cookies.refreshToken

    // Если не найден в куки, пробуем заголовок авторизации
    if (!accessToken) {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Missing Bearer' })
    }
      accessToken = authHeader.slice(7)
    }

    /* 3. проверяем JWT + БД */
    let payload: any
    try {
        payload = await verifyToken(accessToken)
    } catch {
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }
    const { UUID } = payload ?? {}
    if (!UUID) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid payload' })
    }
    await checkAuth(UUID, accessToken)

    /* 4. кладём данные в контекст */
    event.context.auth = { uuid: UUID }
})
