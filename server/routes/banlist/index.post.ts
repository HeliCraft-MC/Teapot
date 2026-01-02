import { createBan } from "~/utils/banlist.utils";
import { resolveUuid, getUserByUUID, isUserAdmin } from "~/utils/user.utils";
import { CreateBanDto, BanEntryPublic } from "~/interfaces/banlist.types";

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
                                ban: { $ref: '#/components/schemas/BanEntry' }
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
    // Авторизация и UUID уже проверены middleware
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

    const dto: CreateBanDto = {
        targetUuid: targetUuid,
        targetIp: body.ip,
        reason: body.reason,
        adminUuid: userUuid,
        adminName: adminUser.NICKNAME || 'Admin',
        durationMs: parseInt(body.duration),
        isIpBan: body.ipBan || false,
        silent: body.silent || false
    };

    const ban = await createBan(dto);

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

    return {
        success: true,
        ban: publicBan
    };
});
