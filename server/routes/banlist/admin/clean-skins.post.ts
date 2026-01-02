import { deleteSkinsBatchForBannedUsers } from "~/utils/banlist.utils";
import { isUserAdmin } from "~/utils/user.utils";

defineRouteMeta({
    openAPI: {
        tags: ['banlist-admin'],
        description: 'Удалить скины всех пользователей, забаненных более чем на X мс (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
            {
                name: 'minDuration',
                in: 'query',
                required: true,
                description: 'Минимальная длительность бана в мс. Примеры: -1 (навсегда), 2592000000 (30 дней)',
                schema: { type: 'integer' }
            }
        ],
        responses: {
            200: {
                description: 'Скины успешно удалены',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean', example: true },
                                deleted: { type: 'integer', description: 'Количество удаленных скинов' },
                                skipped: { type: 'integer', description: 'Количество пропущенных (скин не найден)' },
                                total: { type: 'integer', description: 'Всего пользователей с такой длительностью бана' },
                                users: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            uuid: { type: 'string' },
                                            uuid_nickname: { type: 'string' },
                                            reason: { type: 'string' }
                                        }
                                    }
                                },
                                errors: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            uuid: { type: 'string' },
                                            error: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            400: { description: 'Отсутствует параметр minDuration' },
            403: { description: 'Нет прав доступа (не администратор)' },
            500: { description: 'Ошибка при обработке' }
        }
    }
})

export default defineEventHandler(async (event) => {
    const userUuid = event.context.auth?.uuid;

    if (!userUuid) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            data: { statusMessageRu: 'Не авторизован' }
        });
    }

    // Проверяем права администратора
    const admin = await isUserAdmin(userUuid);
    if (!admin) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
            data: { statusMessageRu: 'Нет прав доступа' }
        });
    }

    const query = getQuery(event);
    const minDuration = query.minDuration as string;

    if (!minDuration) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required parameter',
            data: { statusMessageRu: 'Отсутствует параметр minDuration' }
        });
    }

    const minDurationMs = parseInt(minDuration);
    if (isNaN(minDurationMs)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid parameter format',
            data: { statusMessageRu: 'minDuration должен быть числом' }
        });
    }

    try {
        const result = await deleteSkinsBatchForBannedUsers(minDurationMs);

        return {
            success: true,
            deleted: result.deleted,
            skipped: result.skipped,
            total: result.users.length,
            users: result.users,
            errors: result.errors.length > 0 ? result.errors : undefined
        };
    } catch (e: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Error cleaning banned user skins',
            data: {
                statusMessageRu: 'Ошибка при удалении скинов забаненных пользователей',
                error: e.message
            }
        });
    }
});

