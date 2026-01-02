import {getBanById, searchBans} from "~/utils/banlist.utils";
import { BanEntryPublic } from "~/interfaces/banlist.types";

defineRouteMeta({
    openAPI: {
        tags: ['banlist'],
        description: 'Получить список банов с фильтрацией и поиском',
        parameters: [
            { name: 'limit', in: 'query', description: 'Количество записей (default 20)', schema: { type: 'integer' } },
            { name: 'offset', in: 'query', description: 'Смещение (default 0)', schema: { type: 'integer' } },
            { name: 'active', in: 'query', description: 'Только активные баны (true/false)', schema: { type: 'boolean' } },
            { name: 'q', in: 'query', description: 'Поиск по UUID, имени админа или причине', schema: { type: 'string' } },
            { name: 'id', in: 'query', description: 'Фильтрация по ID бана', schema: { type: 'integer' } }
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
    const id = query.id as string | undefined;
    if (id) {
        const ban = await getBanById(parseInt(id));
        // Преобразуем в публичный формат (без IP и uuid админа)
        const publicBan: BanEntryPublic = {
            id: ban.id,
            uuid: ban.uuid,
            uuid_nickname: ban.uuid_nickname,
            reason: ban.reason,
            banned_by_name: ban.banned_by_name,
            removed_by_name: ban.removed_by_name,
            removed_by_reason: ban.removed_by_reason,
            removed_by_date: ban.removed_by_date,
            time: ban.time,
            until: ban.until,
            template: ban.template,
            server_scope: ban.server_scope,
            silent: ban.silent,
            ipban: ban.ipban,
            active: ban.active
        };
        return publicBan;
    }

    return await searchBans(limit, offset, activeOnly, search);
});
