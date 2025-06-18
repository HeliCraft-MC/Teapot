/* ──────────────────────────────────────────────────────────────
   utils/states/diplomacy.utils.ts
   Дипломатия: альянсы, двусторонние отношения (заявки на смену)
   NB: Реализация войн вынесена в war.utils.ts
   ────────────────────────────────────────────────────────────── */

import {
    IAlliance,
    IAllianceMember,
    AllianceStatus,
    AlliencePurpose,
    IStateRelation,
    RelationKind,
    IStateRelationRequest,
    RelationRequestStatus,
} from '~/interfaces/state/diplomacy.types'
import {
    IHistoryEvent,
    HistoryEventType,
} from '~/interfaces/state/history.types'
import { getStateByUuid } from '~/utils/states/state.utils'
import { addHistoryEvent } from '~/utils/states/history.utils'
import { v4 as uuidv4 } from 'uuid'
import {RolesInState} from "~/interfaces/state/state.types";
import {dirname, join} from "pathe";
import sharp from "sharp";

import { promises as fsp } from 'node:fs'

/** Быстрый доступ к БД «states» */
const db = () => useDatabase('states')

/* ─────────────────────────── helpers ────────────────────────── */

function assertHexColor(hex: string) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
        throw createError({
            statusCode: 422,
            statusMessage: 'Invalid color',
            data: { statusMessageRu: 'Неверный цвет (ожидается #RRGGBB)' },
        })
    }
}

const NAME_RE = /^[a-zA-Z0-9А-Яа-яЁё\s]{3,64}$/

async function assertAllianceName(name: string) {
    if (!NAME_RE.test(name.trim())) {
        throw createError({
            statusCode: 422,
            statusMessage: 'Invalid name',
            data: { statusMessageRu: 'Недопустимое название альянса' },
        })
    }
    const exists = await db()
        .prepare('SELECT 1 FROM alliances WHERE LOWER(name) = ?')
        .get(name.toLowerCase())
    if (exists) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Alliance already exists',
            data: { statusMessageRu: 'Альянс с таким названием уже существует' },
        })
    }
}

/**
 * Загружает файл флага и возвращает относительный путь.
 * @param flag - Буфер с данными изображения.
 * @returns {Promise<string>} - Относительный путь к загруженному файлу.
 */
async function flagToUploads(flag: Buffer): Promise<string> {
    const { uploadDir = './uploads' } = useRuntimeConfig();
    const hex = uuidv4().replace(/-/g, '');
    // Создаем более вложенную структуру для лучшего распределения файлов
    const rel = `flags/${hex.slice(0, 2)}/${hex.slice(2, 4)}/${hex.slice(4, 6)}/${hex}.png`;
    const abs = join(uploadDir, rel);

    await fsp.mkdir(dirname(abs), { recursive: true });
    // Используем sharp для обработки и сохранения изображения в формате PNG
    await sharp(flag).png().toFile(abs);

    return rel;
}

/** Лексикографическое упорядочение пары UUID (state_a_uuid < state_b_uuid) */
function sortPair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a]
}

/* ──────────────────────── 1. АЛЬЯНСЫ ────────────────────────── */

/**
 * Создает новый альянс, сохраняя его флаг как файл.
 * @param creatorStateUuid - UUID государства-создателя.
 * @param creatorPlayerUuid - UUID игрока-создателя.
 * @param name - Название альянса.
 * @param description - Описание альянса.
 * @param purpose - Цель альянса.
 * @param colorHex - Цвет альянса в HEX формате.
 * @param flag - Буфер с данными изображения флага.
 * @returns {Promise<string>} - UUID созданного альянса.
 */
export async function createAlliance(
    creatorStateUuid: string,
    creatorPlayerUuid: string,
    name: string,
    description: string,
    purpose: AlliencePurpose,
    colorHex: string,
    flag: Buffer, // Изменено с flagLink: string на flag: Buffer
): Promise<string> {
    // 1. Проверка прав пользователя
    if (!await isRoleHigherOrEqual(creatorStateUuid, creatorPlayerUuid, RolesInState.VICE_RULER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Отсутствует право создавать альянсы' },
        });
    }

    // 2. Валидация входных данных
    await getStateByUuid(creatorStateUuid);
    await assertAllianceName(name);
    assertHexColor(colorHex);

    // 3. Сохранение флага и получение ссылки
    const flagLink = await flagToUploads(flag);

    const allianceUuid = uuidv4();
    const now = Date.now();

    // 4. Запись данных альянса в базу данных
    const sqlAlliance = db().prepare(`
        INSERT INTO alliances (
            uuid, created, updated,
            name, description, purpose,
            color_hex, creator_state_uuid, flag_link, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const resAlliance = await sqlAlliance.run(
        allianceUuid, now, now, name, description, purpose,
        colorHex, creatorStateUuid, flagLink, AllianceStatus.ACTIVE,
    );
    if (!resAlliance.success) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create alliance',
            data: { statusMessageRu: 'Не удалось создать альянс' },
        });
    }

    // 5. Добавление государства-создателя в члены альянса
    const sqlMember = db().prepare(`
        INSERT INTO alliance_members (
            uuid, created, updated,
            alliance_uuid, state_uuid, is_pending
        ) VALUES (?, ?, ?, ?, ?, 0)
    `);
    await sqlMember.run(uuidv4(), now, now, allianceUuid, creatorStateUuid);

    // 6. Создание события в истории
    const hist: IHistoryEvent = {
        uuid: uuidv4(),
        created: now,
        updated: now,
        type: HistoryEventType.ALLIANCE_CREATED,
        title: 'Создан новый альянс',
        description: `Государство основало альянс «${name}».`,
        state_uuids: [creatorStateUuid],
        alliance_uuids: [allianceUuid],
        player_uuids: [creatorPlayerUuid],
        war_uuid: null,
        city_uuids: null,
        details_json: null,
        created_by_uuid: creatorPlayerUuid,
        season: null,
        is_deleted: false,
        deleted_at: null,
        deleted_by_uuid: null,
    };
    await addHistoryEvent(hist);

    return allianceUuid;
}

/**
 * Вспомогательная функция для преобразования flag_link.
 * Добавляет префикс /distant-api/ к локальным ссылкам.
 * @param flagLink - Ссылка на флаг.
 * @returns {string | null} Преобразованная ссылка на флаг или null.
 */
function transformFlagLink(flagLink: string | null): string | null {
    if (!flagLink) {
        return null;
    }
    // Не изменяем абсолютные URL-адреса
    if (flagLink.startsWith('http://') || flagLink.startsWith('https://')) {
        return flagLink;
    }

    const prefix = "/distant-api";

    // Если ссылка уже начинается со слеша (например, /defaults/flag.png)
    if (flagLink.startsWith('/')) {
        return prefix + flagLink; // результат: /distant-api/defaults/flag.png
    } else {
        // Для относительных путей (например, flags/hash.png)
        return prefix + '/' + flagLink; // результат: /distant-api/flags/hash.png
    }
}



export async function requestAllianceJoin(
    allianceUuid: string,
    stateUuid: string,
    playerUuid: string,
): Promise<void> {
    if (!await isRoleHigherOrEqual(stateUuid, playerUuid, RolesInState.VICE_RULER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Отсутствует право подавать заявки на вступление в альянсы' },
        })
    }

    await getStateByUuid(stateUuid)
    const alliance = await db()
        .prepare('SELECT * FROM alliances WHERE uuid = ? AND status = ?')
        .get(allianceUuid, AllianceStatus.ACTIVE) as IAlliance | undefined

    if (!alliance) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Alliance not found or inactive',
            data: { statusMessageRu: 'Альянс не найден или распущен' },
        })
    }

    const exists = await db()
        .prepare('SELECT 1 FROM alliance_members WHERE alliance_uuid = ? AND state_uuid = ?')
        .get(allianceUuid, stateUuid)
    if (exists) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Already in alliance or pending',
            data: { statusMessageRu: 'Уже в альянсе или заявка на рассмотрении' },
        })
    }

    await db()
        .prepare(`
            INSERT INTO alliance_members (
                uuid, created, updated,
                alliance_uuid, state_uuid, is_pending
            ) VALUES (?, ?, ?, ?, ?, 1)
        `)
        .run(uuidv4(), Date.now(), Date.now(), allianceUuid, stateUuid)
}

export async function reviewAllianceJoin(
    allianceUuid: string,
    applicantStateUuid: string,
    approverStateUuid: string,
    approverPlayerUuid: string,
    approve: boolean,
): Promise<void> {
    if (!(await isRoleHigherOrEqual(approverStateUuid, approverPlayerUuid, RolesInState.DIPLOMAT))) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Отсутствует право рассматривать заявки на вступление в альянсы' },
        })
    }
    const row = await db()
        .prepare(`
            SELECT * FROM alliance_members
            WHERE alliance_uuid = ? AND state_uuid = ? AND is_pending = 1
        `)
        .get(allianceUuid, applicantStateUuid) as IAllianceMember | undefined

    if (!row) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Application not found',
            data: { statusMessageRu: 'Заявка не найдена' },
        })
    }

    if (approve) {
        await db()
            .prepare('UPDATE alliance_members SET is_pending = 0, updated = ? WHERE uuid = ?')
            .run(Date.now(), row.uuid)

        const hist: IHistoryEvent = {
            uuid: uuidv4(),
            created: Date.now(),
            updated: Date.now(),
            type: HistoryEventType.ALLIANCE_MEMBER_JOINED,
            title: 'Новое государство в альянсе',
            description: `Государство присоединилось к альянсу.`,
            state_uuids: [applicantStateUuid],
            alliance_uuids: [allianceUuid],
            player_uuids: [approverPlayerUuid],
            war_uuid: null,
            city_uuids: null,
            details_json: null,
            created_by_uuid: approverPlayerUuid,

            season: null,
            is_deleted: false,
            deleted_at: null,
            deleted_by_uuid: null,
        }

        await addHistoryEvent(hist)
    } else {
        await db()
            .prepare('DELETE FROM alliance_members WHERE uuid = ?')
            .run(row.uuid)
    }
}

export async function leaveAlliance(
    allianceUuid: string,
    stateUuid: string,
    playerUuid: string,
): Promise<void> {
    if (!await isRoleHigherOrEqual(stateUuid, playerUuid, RolesInState.VICE_RULER)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Отсутствует право покидать альянсы' },
        })
    }
    const res = await db()
        .prepare('DELETE FROM alliance_members WHERE alliance_uuid = ? AND state_uuid = ?')
        .run(allianceUuid, stateUuid)

    if (!res.success) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Membership not found',
            data: { statusMessageRu: 'Государство не состоит в альянсе' },
        })
    }

    const hist: IHistoryEvent = {
        uuid: uuidv4(),
        created: Date.now(),
        updated: Date.now(),
        type: HistoryEventType.ALLIANCE_MEMBER_LEFT,
        title: 'Государство покинуло альянс',
        description: `Государство вышло из альянса.`,
        state_uuids: [stateUuid],
        alliance_uuids: [allianceUuid],
        player_uuids: [playerUuid],
        war_uuid: null,
        city_uuids: null,
        details_json: null,
        created_by_uuid: playerUuid,

        season: null,
        is_deleted: false,
        deleted_at: null,
        deleted_by_uuid: null,
    }

    await addHistoryEvent(hist)

    const { count } = (await db()
        .prepare(`
            SELECT COUNT(*) as count
            FROM alliance_members
            WHERE alliance_uuid = ? AND is_pending = 0
        `)
        .get(allianceUuid)) as { count: number }

    if (count < 1) {
        await dissolveAlliance(allianceUuid, playerUuid)
    }
}

export async function dissolveAlliance(
    allianceUuid: string,
    byPlayerUuid: string,
    stateUuid?: string,
): Promise<void> {
    if(stateUuid){
        if (!await isRoleHigherOrEqual(stateUuid, byPlayerUuid, RolesInState.RULER)) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Not authorized',
                data: { statusMessageRu: 'Отсутствует право распускать альянсы' },
            })
        }
    }
    await db()
        .prepare('UPDATE alliances SET status = ?, updated = ? WHERE uuid = ?')
        .run(AllianceStatus.DISSOLVED, Date.now(), allianceUuid)

    await db()
        .prepare('DELETE FROM alliance_members WHERE alliance_uuid = ?')
        .run(allianceUuid)

    if (stateUuid) {
        const hist: IHistoryEvent = {
            uuid: uuidv4(),
            created: Date.now(),
            updated: Date.now(),
            type: HistoryEventType.ALLIANCE_DISSOLVED,
            title: 'Альянс распущен',
            description: 'Альянс прекратил существование.',
            state_uuids: [stateUuid],
            alliance_uuids: [allianceUuid],
            player_uuids: [byPlayerUuid],
            war_uuid: null,
            city_uuids: null,
            details_json: null,
            created_by_uuid: byPlayerUuid,

            season: null,
            is_deleted: false,
            deleted_at: null,
            deleted_by_uuid: null,
        }

        await addHistoryEvent(hist)

    } else {

        const hist: IHistoryEvent = {
            uuid: uuidv4(),
            created: Date.now(),
            updated: Date.now(),
            type: HistoryEventType.ALLIANCE_DISSOLVED,
            title: 'Альянс распущен',
            description: 'Альянс прекратил существование в связи в выходом из него последнего члена.',
            state_uuids: null,
            alliance_uuids: [allianceUuid],
            player_uuids: [byPlayerUuid],
            war_uuid: null,
            city_uuids: null,
            details_json: null,
            created_by_uuid: byPlayerUuid,

            season: null,
            is_deleted: false,
            deleted_at: null,
            deleted_by_uuid: null,
        }

        await addHistoryEvent(hist)
    }
}

export async function getAllianceByUuid(uuid: string): Promise<IAlliance> {
    const row = await db()
        .prepare('SELECT * FROM alliances WHERE uuid = ?')
        .get(uuid) as IAlliance | undefined

    if (!row) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Alliance not found',
            data: { statusMessageRu: 'Альянс не найден' },
        })
    }

    row.flag_link = transformFlagLink(row.flag_link)

    return row
}

export async function listAllianceMembers(
    allianceUuid: string,
): Promise<IAllianceMember[]> {
    return (await db()
        .prepare('SELECT * FROM alliance_members WHERE alliance_uuid = ? AND is_pending = 0')
        .all(allianceUuid)) as IAllianceMember[]
}

export async function listAlliancesForState(
    stateUuid: string,
): Promise<IAlliance[]> {
    return (await db()
        .prepare(`
            SELECT a.*
            FROM alliance_members am
            JOIN alliances a ON a.uuid = am.alliance_uuid
            WHERE am.state_uuid = ?
              AND am.is_pending = 0
              AND a.status = ?
        `)
        .all(stateUuid, AllianceStatus.ACTIVE)) as IAlliance[]
}

export async function listAlliances(
    startAt = 0,
    limit = 100
): Promise<IAlliance[]> {
    return (await db()
        .prepare('SELECT * FROM alliances WHERE status = ? ORDER BY created DESC LIMIT ? OFFSET ?')
        .all(AllianceStatus.ACTIVE, limit, startAt)) as IAlliance[]
}

/* ───────────────── 2. ДВУСТОРОННИЕ ОТНОШЕНИЯ ────────────────── */

/**
 * Вспомогательная «мгновенная» функция, применяющая изменение отношений
 * к таблице state_relations без ожидания подтверждения:
 *   – kind = null → удаляет запись (возврат к «нейтралитету»)
 *   – иначе обновляет/вставляет запись с указанным RelationKind
 */
async function _applyRelation(
    stateUuidA: string,
    stateUuidB: string,
    kind: RelationKind | null,
): Promise<void> {
    const [a, b] = sortPair(stateUuidA, stateUuidB)

    if (kind === null) {
        await db()
            .prepare('DELETE FROM state_relations WHERE state_a_uuid = ? AND state_b_uuid = ?')
            .run(a, b)
        return
    }

    const exists = await db()
        .prepare('SELECT 1 FROM state_relations WHERE state_a_uuid = ? AND state_b_uuid = ?')
        .get(a, b)

    if (exists) {
        await db()
            .prepare('UPDATE state_relations SET kind = ?, updated = ? WHERE state_a_uuid = ? AND state_b_uuid = ?')
            .run(kind, Date.now(), a, b)
    } else {
        await db()
            .prepare(`
        INSERT INTO state_relations (
          uuid, created, updated,
          state_a_uuid, state_b_uuid, kind
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
            .run(uuidv4(), Date.now(), Date.now(), a, b, kind)
    }
}

/**
 * 2.1. Создать заявку на изменение двусторонних отношений
 *
 * @param proposerStateUuid — UUID государства, которое инициирует смену
 * @param targetStateUuid   — UUID второго государства
 * @param requestedKind     — желаемый RelationKind (или null для разрыва договора)
 * @param proposerPlayerUuid— UUID игрока (дипломата) инициатора
 * @returns UUID вновь созданной заявки
 */
export async function requestRelationChange(
    proposerStateUuid: string,
    targetStateUuid: string,
    requestedKind: RelationKind | null,
    proposerPlayerUuid: string,
): Promise<string> {
    if (proposerStateUuid === targetStateUuid) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Same state',
            data: { statusMessageRu: 'Нельзя изменить отношения с самим собой' },
        })
    }
    if (!await isRoleHigherOrEqual(proposerStateUuid, proposerPlayerUuid, RolesInState.DIPLOMAT)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Отсутствует право инициировать заявки на отношения' },
        })
    }
    await getStateByUuid(proposerStateUuid)
    await getStateByUuid(targetStateUuid)

    const [a, b] = sortPair(proposerStateUuid, targetStateUuid)

    const pending = await db()
        .prepare(`
      SELECT 1
      FROM state_relation_requests
      WHERE state_a_uuid = ? AND state_b_uuid = ? AND status = ?
    `)
        .get(a, b, RelationRequestStatus.PENDING)
    if (pending) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Already requested',
            data: { statusMessageRu: 'Уже есть ожидающая заявка на изменение отношений' },
        })
    }

    const reqUuid = uuidv4()
    await db()
        .prepare(`
      INSERT INTO state_relation_requests (
        uuid, created, updated,
        state_a_uuid, state_b_uuid,
        proposer_state_uuid, requested_kind, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
        .run(
            reqUuid,
            Date.now(),
            Date.now(),
            a,
            b,
            proposerStateUuid,
            requestedKind,
            RelationRequestStatus.PENDING,
        )

    return reqUuid
}

/**
 * 2.2. Рассмотреть (одобрить/отклонить) заявку на изменение отношений
 *
 * @param requestUuid       — UUID заявки в state_relation_requests
 * @param reviewerStateUuid — UUID государства, рассматривающего заявку
 * @param reviewerPlayerUuid — UUID игрока (дипломата), который рассматривает заявку
 * @param approve           — true → применить изменение, false → отклонить
 */
export async function reviewRelationChange(
    requestUuid: string,
    reviewerStateUuid: string,
    reviewerPlayerUuid: string,
    approve: boolean,
): Promise<void> {
    if (!(await isRoleHigherOrEqual(reviewerStateUuid, reviewerPlayerUuid, RolesInState.DIPLOMAT) || await isUserAdmin(reviewerPlayerUuid))) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Отсутствует право рассматривать заявки на отношения' },
        })
    }

    const row = await db()
        .prepare('SELECT * FROM state_relation_requests WHERE uuid = ?')
        .get(requestUuid) as IStateRelationRequest | undefined

    if (!row || row.status !== RelationRequestStatus.PENDING) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Request not found',
            data: { statusMessageRu: 'Заявка не найдена или уже рассмотрена' },
        })
    }

    const { state_a_uuid, state_b_uuid, proposer_state_uuid, requested_kind } = row

    // Только «вторая сторона» (не инициатор) может рассмотреть
    if (
        (reviewerStateUuid !== state_a_uuid && reviewerStateUuid !== state_b_uuid) ||
        reviewerStateUuid === proposer_state_uuid
    ) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Not authorized',
            data: { statusMessageRu: 'Отсутствует право рассматривать заявку' },
        })
    }

    const now = Date.now()

    if (approve) {
        // Применяем изменение в state_relations
        await db()
            .prepare(`
                DELETE FROM state_relation_requests
                WHERE state_a_uuid = ? AND state_b_uuid = ? AND status = ?
            `)
            .run(state_a_uuid, state_b_uuid, RelationRequestStatus.APPROVED);

        await _applyRelation(state_a_uuid, state_b_uuid, requested_kind)



        await db()
            .prepare(`
        UPDATE state_relation_requests
        SET status = ?, updated = ?
        WHERE uuid = ?
      `)
            .run(RelationRequestStatus.APPROVED, now, requestUuid)

        const [state_a, state_b] = await Promise.all([
            getStateByUuid(state_a_uuid),
            getStateByUuid(state_b_uuid),
        ])


        const relationText = (kind: RelationKind | null) => {
            if (kind === null) return 'Нейтралитет (разрыв)';
            return {
                [RelationKind.NEUTRAL]: 'Нейтралитет',
                [RelationKind.ALLY]: 'Дружба',
                [RelationKind.ENEMY]: 'Вражда',
            }[kind];
        };

        const description =
            requested_kind === null
                ? 'Отношения расторгнуты'
                : `Государства ${state_a.name} и ${state_b.name} установили статус двусторонних отношений «${relationText(requested_kind)}».`

        const hist: IHistoryEvent = {
            uuid: uuidv4(),
            created: now,
            updated: now,
            type: HistoryEventType.TREATY_SIGNED,
            title: 'Изменение межгосударственных отношений',
            description,
            state_uuids: [state_a_uuid, state_b_uuid],
            alliance_uuids: null,
            player_uuids: [reviewerPlayerUuid],
            war_uuid: null,
            city_uuids: null,
            details_json: JSON.stringify({ requested_kind }),
            created_by_uuid: reviewerPlayerUuid,

            season: null,
            is_deleted: false,
            deleted_at: null,
            deleted_by_uuid: null,
        }

        await addHistoryEvent(hist)
    } else {
        await db()
            .prepare(`
                DELETE FROM state_relation_requests
                WHERE state_a_uuid = ? AND state_b_uuid = ? AND status = ?
            `)
            .run(state_a_uuid, state_b_uuid, RelationRequestStatus.DECLINED);

        await db()
            .prepare('UPDATE state_relation_requests SET status = ?, updated = ? WHERE uuid = ?')
            .run(RelationRequestStatus.DECLINED, now, requestUuid)
    }
}

/**
 * 2.3. Получить текущий характер отношений (если нет записи → null)
 */
export async function getRelation(
    stateUuidA: string,
    stateUuidB: string,
): Promise<RelationKind | null> {
    const [a, b] = sortPair(stateUuidA, stateUuidB)
    const row = await db()
        .prepare('SELECT kind FROM state_relations WHERE state_a_uuid = ? AND state_b_uuid = ?')
        .get(a, b) as { kind: RelationKind } | undefined

    return row ? row.kind : null
}

/**
 * 2.4. Список всех отношений для данного государства
 */
export async function getStateRelationsList(
    stateUuid: string,
): Promise<IStateRelation[]> {
    return (await db()
        .prepare(`
            SELECT * FROM state_relations
            WHERE state_a_uuid = ? OR state_b_uuid = ?
        `)
        .all(stateUuid, stateUuid)) as IStateRelation[]
}

export async function listPendingRelationRequests(
    stateUuid: string
): Promise<IStateRelationRequest[]> {
    const [aDummy, bDummy] = sortPair(stateUuid, stateUuid) // здесь можно просто использовать MySQL-условие OR
    return (await db()
        .prepare(`
      SELECT * FROM state_relation_requests
      WHERE (state_a_uuid = ? OR state_b_uuid = ?)
        AND status = ?
    `)
        .all(stateUuid, stateUuid, RelationRequestStatus.PENDING)) as IStateRelationRequest[]
}


/* ─────────────────────────── EOF ────────────────────────────── */
