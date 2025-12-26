import { isUserBanned } from "~/utils/banlist.utils";
import { resolveUuid } from "~/utils/user.utils";

defineRouteMeta({
    openAPI: {
        tags: ['banlist'],
        description: 'Проверить статус бана пользователя',
        parameters: [
            { name: 'target', in: 'query', required: true, description: 'UUID или никнейм пользователя', schema: { type: 'string' } }
        ],
        responses: {
            200: {
                description: 'Статус бана',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                banned: { type: 'boolean' }
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
    const target = query.target as string;

    if (!target) {
        return { banned: false };
    }

    try {
        const uuid = await resolveUuid(target);
        const banned = await isUserBanned(uuid);
        return { banned };
    } catch (e) {
        return { banned: false };
    }
});
