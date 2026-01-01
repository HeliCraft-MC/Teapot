import { searchBans } from "~/utils/banlist.utils";

defineRouteMeta({
    openAPI: {
        tags: ['banlist'],
        description: 'Получить список банов с фильтрацией и поиском',
        parameters: [
            { name: 'limit', in: 'query', description: 'Количество записей (default 20)', schema: { type: 'integer' } },
            { name: 'offset', in: 'query', description: 'Смещение (default 0)', schema: { type: 'integer' } },
            { name: 'active', in: 'query', description: 'Только активные баны (true/false)', schema: { type: 'boolean' } },
            { name: 'q', in: 'query', description: 'Поиск по UUID, имени админа или причине', schema: { type: 'string' } }
        ],
        responses: {
            200: {
                description: 'Список банов и общее количество',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                items: { type: 'array', items: { $ref: '#/components/schemas/BanEntry' } },
                                total: { type: 'integer' }
                            }
                        }
                    }
                }
            }
        }
    }
})

export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    const limit = parseInt(query.limit as string) || 20;
    const offset = parseInt(query.offset as string) || 0;
    const activeOnly = query.active === 'true';
    const search = query.q as string | undefined;

    const result = await searchBans(limit, offset, activeOnly, search);

    return result;
});
