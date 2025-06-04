import { IBaseEntity } from './common.types';

/* ────────────────────────────────────────────────────────────── */
/*  Альянсы                                                      */
/* ────────────────────────────────────────────────────────────── */

/** Статус альянса */
export enum AllianceStatus {
    ACTIVE    = 'active',   // действует
    DISSOLVED = 'dissolved' // распущен
}

export enum AlliencePurpose {
    ECONOMIC    = 'economic',    // экономическое сотрудничество
    MILITARY    = 'military',    // военное сотрудничество
    DIPLOMATIC  = 'diplomatic',  // дипломатическое сотрудничество
    GENERAL     = 'general',    // общее сотрудничество
    OTHER       = 'other'        // другое
}

/**
 * Надгосударственный союз.
 */
export interface IAlliance extends IBaseEntity {
    /** Название */
    name: string;

    /** Описание / устав */
    description: string;

    /** Основная цель существования */
    purpose: string;

    /** Фирменный цвет (#RRGGBB) */
    color_hex: string;

    /** Государство-основатель */
    creator_state_uuid: string;

    /** URL флага */
    flag_link: string;

    /** Текущий статус */
    status: AllianceStatus;
}

/**
 * Связка «государство ↔ альянс».
 * `isPending = true` означает, что заявка ещё не одобрена.
 */
export interface IAllianceMember extends IBaseEntity {
    alliance_uuid: string;
    state_uuid: string;
    is_pending: boolean;
}

/* ────────────────────────────────────────────────────────────── */
/*  Двусторонние отношения                                       */
/* ────────────────────────────────────────────────────────────── */

export enum RelationRequestStatus {
    PENDING  = 'pending',   // ожидание рассмотрения второй стороной
    APPROVED = 'approved',  // одобрено, изменения применены
    DECLINED = 'declined',  // отклонено, заявка закрыта
}

/** Характер отношений между двумя государствами */
export enum RelationKind {
    NEUTRAL = 'neutral', // нейтралитет
    ALLY    = 'ally',    // союзники
    ENEMY   = 'enemy'    // состояние войны / вражды
}

/**
 * Заявка на изменение (или удаление) двусторонних отношений между двумя государствами.
 */
export interface IStateRelationRequest extends IBaseEntity {
    /** UUID первого (в упорядоченном виде) государства (state_a_uuid < state_b_uuid) */
    state_a_uuid: string

    /** UUID второго (в упорядоченном виде) государства */
    state_b_uuid: string

    /** UUID государства, попросившего изменение (proposer_state_uuid) */
    proposer_state_uuid: string

    /**
     * Требуемый новый характер отношений:
     *  – RelationKind.ALLY  → союзники
     *  – RelationKind.ENEMY → враги
     *  – RelationKind.NEUTRAL
     *  - null → удалить отношения
     */
    requested_kind: RelationKind | null

    /** Статус заявки (pending | approved | declined) */
    status: RelationRequestStatus
}

/**
 * Для каждой неупорядоченной пары государств ровно одна запись.
 */
export interface IStateRelation extends IBaseEntity {
    state_a_uuid: string;
    state_b_uuid: string;
    kind: RelationKind;
}

/* ────────────────────────────────────────────────────────────── */
/*  Войны                                                         */
/* Войны состоят из сражений                                      */
/* ────────────────────────────────────────────────────────────── */

/** Тип сценария сражения */
export enum BattleType {
    FIELD_BATTLE    = 'field_battle',    // открытое поле
    SIEGE           = 'siege',           // осада / защита
    FLAG_CAPTURE    = 'flag_capture',    // захват флага
    SCENARIO        = 'scenario',        // сюжетное PvP-мероприятие
    DUEL_TOURNAMENT = 'duel_tournament'  // серия дуэлей
}

/** Текущая стадия войны */
export enum WarStatus {
    PROPOSED   = 'proposed', // предложена одной из сторон
    ACCEPTED   = 'accepted', // принята, не одобрена администратором
    DECLINED   = 'declined', // отклонена одной из сторон
    CANCELLED  = 'cancelled', // отменена администратором или одной из сторон
    SCHEDULED  = 'scheduled', // назначена (одобрена администратором)
    ONGOING    = 'ongoing',   // идёт
    ENDED      = 'ended'      // завершена
}

/** Статус сражения */
export enum BattleStatus {
    PROPOSED   = 'proposed', // предложено одной из сторон
    ACCEPTED   = 'accepted', // принято, не одобрено администратором
    DECLINED   = 'declined', // отклонено одной из сторон
    CANCELLED  = 'cancelled', // отменено администратором или одной из сторон
    SCHEDULED = 'scheduled', // назначена (одобрена администратором)
    ONGOING   = 'ongoing',   // идёт
    ENDED     = 'ended',     // завершена
}

/**
 * Контейнер войны (метаданные конфликта).
 */
export interface IWar extends IBaseEntity {
    /** Название конфликта */
    name: string;

    reason: string;

    victory_condition: string;

    /** Текущий статус */
    status: WarStatus;

    /** Итог («3-2», «ничья»…) ― null, пока война не закончилась */
    result: string | null;

    result_action: string | null;
}

export interface IWarBattle extends IBaseEntity {
    war_uuid: string;
    name: string;
    description: string;
    type: BattleType;
    status: BattleStatus;
    result: string | null;
    /** Дата начала сражения (Unix-время) */
    start_date: number;
    /** Дата окончания сражения (Unix-время) */
    end_date: number | null; // null, если ещё не завершено
}

/** Роль конкретного государства в войне */
export enum WarSideRole {
    ATTACKER       = 'attacker',        // инициатор
    DEFENDER       = 'defender',        // защищающийся
    ALLY_ATTACKER  = 'ally_attacker',   // союзник атакующей стороны
    ALLY_DEFENDER  = 'ally_defender'    // союзник защитников
}

/**
 * Связка «государство ↔ война».
 */
export interface IWarParticipant extends IBaseEntity {
    war_uuid: string;
    state_uuid: string;
    side_role: WarSideRole;
}
