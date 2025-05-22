export default defineEventHandler((event) => {
    // Запрашивающий источник
    const origin = getHeader(event, 'origin') || '*'

    // Базовые CORS-заголовки
    setHeader(event, 'Access-Control-Allow-Origin', origin)
    setHeader(event, 'Vary', 'Origin')                 // чтобы кеш был корректным
    setHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setHeader(
        event,
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    )
    setHeader(
        event,
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
    )

    // Preflight быстро завершаем с 204
    if (event.method === 'OPTIONS') {
        event.node.res.statusCode = 204
        event.node.res.statusMessage = 'No Content'
        return 'ok'
    }
})