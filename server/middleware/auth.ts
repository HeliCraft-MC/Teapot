// server/middleware/auth.ts

/* ---------- правила исключений ---------- */
interface ExcludeRule {
    pattern: RegExp
    methods?: string[]        // UPPER-case
}
const exclude: ExcludeRule[] = [
    { pattern: /^\/auth\/login(?:\?.*)?$/ },
    { pattern: /^\/auth\/register(?:\?.*)?$/ },
    { pattern: /^\/auth\/refresh$/ },
    { pattern: /^\/auth\/logout$/ },
    { pattern: /^\/user\/[^/]+\/skin(?:\/head)?(?:\.png)?$/, methods: ['GET', 'HEAD'] },
    { pattern: /^\/user\/[^/]$/, methods: ['GET'] }, // /user/UUID
    { pattern: /^\/$/ },
    { pattern: /^\/_scalar$/ },
    { pattern: /^\/_swagger$/ },
    { pattern: /^\/_openapi\.json$/ },
    { pattern: /^\/state\/list$/ },
    { pattern: /^\/state\/search(\/.*)$/ },
    { pattern: /^\/server\/status$/ },
    { pattern: /^\/flags(\/.*)?$/ },
    { pattern: /^\/state\/[^/]+$/, methods: ['GET'] },
    { pattern: /^\/state\/[^/]+\/some$/, methods: ['GET'] },
    { pattern: /^\/user\/[^/]+$/, methods: ['GET'] }, // /user/UUID
    { pattern: /^\/order\/list(?:\?.*)?$/, methods: ['GET'] },
    { pattern: /^\/warrant\/list(?:\?.*)?$/, methods: ['GET'] },
    { pattern: /^\/history\/list(?:\?.*)?$/, methods: ['GET'] },
    { pattern: /^\/state\/[^/]+\/members-count$/, methods: ['GET'] },
    { pattern: /^\/alliances\/list(?:\?.*)?$/, methods: ['GET'] },
    { pattern: /^\/alliances\/[^/]+\/members(?:\?.*)?$/, methods: ['GET'] },
    { pattern: /^\/alliances\/[0-9a-fA-F-]+$/, methods: ['GET'] },
    { pattern: /^\/user\/[^/]+\/(?:head|skin(?:\/head)?)(?:\.png)?$/, methods: ['GET', 'HEAD'] },
    { pattern: /^\/banlist(?:\?.*)?$/, methods: ['GET'] },
    { pattern: /^\/banlist\/check(?:\?.*)?$/, methods: ['GET'] },
    // Gallery public routes
    { pattern: /^\/gallery(?:\?.*)?$/, methods: ['GET'] },
    { pattern: /^\/gallery\/ids(?:\?.*)?$/, methods: ['GET'] },
    { pattern: /^\/gallery\/categories(?:\?.*)?$/, methods: ['GET'] },
    { pattern: /^\/gallery\/seasons(?:\?.*)?$/, methods: ['GET'] },
    { pattern: /^\/gallery\/[0-9a-fA-F-]+$/, methods: ['GET'] },
    { pattern: /^\/gallery\/[0-9a-fA-F-]+\/image$/, methods: ['GET'] }
]

export default defineEventHandler(async (event) => {
    const url    = event.path || event.node.req.url || '/'
    const method = (event.method || event.node.req.method || 'GET').toUpperCase()

    console.log(`[auth middleware] ${method} ${url}`)

    /* 1. исключаем public-роуты */
    for (const rule of exclude) {
        if (rule.pattern.test(url) &&
            (!rule.methods || rule.methods.includes(method))) {
            console.log(`[auth middleware] Excluded by rule: ${rule.pattern}`)
            return
        }
    }

    /* 2. Bearer */
    // Сначала пробуем получить токен из заголовка авторизации
    const authHeader = getHeader(event, 'authorization')
    let accessToken: string | undefined

    if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.slice(7)
        console.log('[auth middleware] Token from Authorization header:', accessToken.substring(0, 20) + '...')
    }

    // Если не найден в заголовке, пробуем cookies (только accessToken, не refreshToken!)
    if (!accessToken) {
        const cookies = parseCookies(event)
        accessToken = cookies['auth.token']
        if (accessToken) {
            console.log('[auth middleware] Token from cookie:', accessToken.substring(0, 20) + '...')
        }
    }

    if (!accessToken) {
        console.log('[auth middleware] No token found - Missing Bearer')
        throw createError({ statusCode: 401, statusMessage: 'Missing Bearer' })
    }

    /* 3. проверяем JWT + БД */
    let payload: any
    try {
        payload = await verifyToken(accessToken)
        console.log('[auth middleware] JWT verified, payload UUID:', payload?.UUID)
    } catch (err) {
        console.log('[auth middleware] JWT verification failed:', err)
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }
    const { UUID } = payload ?? {}
    if (!UUID) {
        console.log('[auth middleware] No UUID in payload')
        throw createError({ statusCode: 401, statusMessage: 'Invalid payload' })
    }
    await checkAuth(UUID, accessToken)
    console.log('[auth middleware] Auth check passed for UUID:', UUID)

    /* 4. кладём данные в контекст */
    event.context.auth = { uuid: UUID }
})
