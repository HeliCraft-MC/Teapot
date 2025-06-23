// server/middleware/cors.ts
import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler((event) => {
    const origin = event.node.req.headers.origin || '*'

    // общие CORS-заголовки
    setHeader(event, 'Access-Control-Allow-Origin', origin)
    setHeader(event, 'Vary', 'Origin')
    setHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setHeader(event, 'Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    // preflight
    if (event.node.req.method === 'OPTIONS') {
        event.node.res.writeHead(204, 'No Content')
        return 'ok'
    }

    // преобразуем HEAD → GET, чтобы основной handler отработал как GET
    if (event.node.req.method === 'HEAD') {
        // запомним, что изначально был HEAD
        (event.context as any)._isHead = true
        event.node.req.method = 'GET'
    }
})
