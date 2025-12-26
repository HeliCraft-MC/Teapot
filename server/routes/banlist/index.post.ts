import { createBan, isUserBanned } from "~/utils/banlist.utils";
import { checkAuth } from "~/utils/auth.utils";
import { resolveUuid, getUserByUUID, isUserAdmin } from "~/utils/user.utils";
import { CreateBanDto } from "~/interfaces/banlist.types";

defineRouteMeta({
    openAPI: {
        tags: ['banlist'],
        description: 'Создать новый бан (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['target', 'reason', 'duration'],
                        properties: {
                            target: { type: 'string', description: 'UUID или никнейм цели' },
                            reason: { type: 'string', description: 'Причина бана' },
                            duration: { type: 'integer', description: 'Длительность в мс (-1 или <=0 для навсегда)' },
                            ip: { type: 'string', description: 'IP адрес (опционально)' },
                            ipBan: { type: 'boolean', description: 'Банить ли по IP' },
                            silent: { type: 'boolean', description: 'Скрытый бан' }
                        }
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Бан успешно создан',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean', example: true },
                                banId: { type: 'integer' }
                            }
                        }
                    }
                }
            },
            401: { description: 'Не авторизован' },
            403: { description: 'Нет прав доступа' },
            400: { description: 'Ошибка валидации' }
        }
    }
})

export default defineEventHandler(async (event) => {
    const accessToken = getHeader(event, 'Authorization')?.replace('Bearer ', '');
    const userUuid = getHeader(event, 'x-uuid');

    if (!accessToken || !userUuid) {
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

    const body = await readBody(event);
    if (!body.target || !body.reason || !body.duration) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields',
            data: { statusMessageRu: 'Не заполнены обязательные поля' }
        });
    }

    const targetUuid = await resolveUuid(body.target);
    const adminUser = await getUserByUUID(userUuid);

    // Optional: check if already banned to avoid dupes? (LiteBans might handle it or allow multiple)
    // We'll proceed as usual, database handles inserts.

    const dto: CreateBanDto = {
        targetUuid: targetUuid,
        targetIp: body.ip, // Optional
        reason: body.reason,
        adminUuid: userUuid,
        adminName: adminUser.NICKNAME || 'Admin',
        durationMs: parseInt(body.duration), // milliseconds
        isIpBan: body.ipBan || false,
        silent: body.silent || false
    };

    const banId = await createBan(dto);

    return {
        success: true,
        banId
    };
});
