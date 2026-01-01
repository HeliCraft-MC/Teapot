import { removeBan } from "~/utils/banlist.utils";
import { checkAuth } from "~/utils/auth.utils";
import { getUserByUUID, isUserAdmin } from "~/utils/user.utils";

defineRouteMeta({
    openAPI: {
        tags: ['banlist'],
        description: 'Снять бан (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
            { name: 'id', in: 'path', required: true, description: 'ID бана', schema: { type: 'integer' } }
        ],
        requestBody: {
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            reason: { type: 'string', description: 'Причина снятия бана (default: Unbanned via Web)' }
                        }
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Бан успешно снят',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean', example: true }
                            }
                        }
                    }
                }
            },
            401: { description: 'Не авторизован' },
            403: { description: 'Нет прав доступа' },
            404: { description: 'Бан не найден или уже снят' }
        }
    }
})

export default defineEventHandler(async (event) => {
    const accessToken = getHeader(event, 'Authorization')?.replace('Bearer ', '');
    const userUuid = getHeader(event, 'x-uuid');
    const id = getRouterParam(event, 'id');

    if (!accessToken || !userUuid || !id) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            data: { statusMessageRu: 'Не авторизован' }
        });
    }

    try {
        await checkAuth(userUuid, accessToken);
        const admin = await isUserAdmin(userUuid);
        if (!admin) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                data: { statusMessageRu: 'Нет прав доступа' }
            });
        }
    } catch (e: any) {
        throw createError({
            statusCode: e.statusCode || 401,
            statusMessage: e.statusMessage || 'Unauthorized',
            data: e.data || { statusMessageRu: 'Ошибка авторизации' }
        });
    }

    const adminUser = await getUserByUUID(userUuid);
    const body = await readBody(event).catch(() => ({}));
    const reason = body.reason || "Unbanned via Web";

    await removeBan(parseInt(id), userUuid, adminUser.NICKNAME, reason);

    return { success: true };
});
