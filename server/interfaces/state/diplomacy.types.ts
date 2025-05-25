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
    colorHex: string;

    /** Государство-основатель */
    creatorStateUuid: string;

    /** URL флага */
    flagLink: string;

    /** Текущий статус */
    status: AllianceStatus;
}

/**
 * Связка «государство ↔ альянс».
 * `isPending = true` означает, что заявка ещё не одобрена.
 */
export interface IAllianceMember extends IBaseEntity {
    allianceUuid: string;
    stateUuid: string;
    isPending: boolean;
}

/* ────────────────────────────────────────────────────────────── */
/*  Двусторонние отношения                                       */
/* ────────────────────────────────────────────────────────────── */

/** Характер отношений между двумя государствами */
export enum RelationKind {
    NEUTRAL = 'neutral', // нейтралитет
    ALLY    = 'ally',    // союзники
    ENEMY   = 'enemy'    // состояние войны / вражды
}

/**
 * Для каждой неупорядоченной пары государств ровно одна запись.
 */
export interface IStateRelation extends IBaseEntity {
    stateAUuid: string;
    stateBUuid: string;
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

    victoryCondition: string;

    /** Текущий статус */
    status: WarStatus;

    /** Итог («3-2», «ничья»…) ― null, пока война не закончилась */
    result: string | null;

    resultAction: string | null;
}

export interface IWarBattle extends IBaseEntity {
    warUuid: string;
    name: string;
    description: string;
    type: BattleType;
    status: BattleStatus;
    result: string | null;
    /** Дата начала сражения (Unix-время) */
    startDate: number;
    /** Дата окончания сражения (Unix-время) */
    endDate: number | null; // null, если ещё не завершено
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
    warUuid: string;
    stateUuid: string;
    sideRole: WarSideRole;
}
