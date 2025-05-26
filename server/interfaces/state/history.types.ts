import { IBaseEntity } from './common.types';

/* ────────────────────────────────────────────────────────────── */
/*  Категории исторических событий                               */
/* ────────────────────────────────────────────────────────────── */

export enum HistoryEventType {
    /* --- Государства --- */
    STATE_CREATED          = 'state_created',          // основание государства
    STATE_STATUS_CHANGED   = 'state_status_changed',   // смена статуса
    STATE_RENAMED          = 'state_renamed',          // переименование
    LEADER_CHANGED         = 'leader_changed',         // смена правителя
    CAPITAL_MOVED          = 'capital_moved',          // перенос столицы
    LAW_PASSED             = 'law_passed',             // принят закон

    /* --- Города --- */
    CITY_FOUNDED           = 'city_founded',           // основание города
    CITY_JOINED_STATE      = 'city_joined_state',      // город вошёл в состав
    CITY_LEFT_STATE        = 'city_left_state',        // город вышел из состава
    CITY_RENAMED           = 'city_renamed',           // переименование города

    /* --- Альянсы --- */
    ALLIANCE_CREATED       = 'alliance_created',       // создание альянса
    ALLIANCE_MEMBER_JOINED = 'alliance_member_joined', // член вступил
    ALLIANCE_MEMBER_LEFT   = 'alliance_member_left',   // член вышел
    ALLIANCE_DISSOLVED     = 'alliance_dissolved',     // распуск альянса

    /* --- Войны --- */
    WAR_DECLARED           = 'war_declared',           // объявление войны
    WAR_BATTLE             = 'war_battle',             // конкретное сражение
    WAR_FINISHED           = 'war_finished',           // завершение войны
    TRUCE_SIGNED           = 'truce_signed',           // перемирие

    /* --- Дипломатия / экономика --- */
    TREATY_SIGNED          = 'treaty_signed',          // подпись договора
    BORDER_CHANGED         = 'border_changed',         // изменение границ
    TRADE_AGREEMENT        = 'trade_agreement',        // торговое соглашение

    /* --- Игроки и роли --- */
    PLAYER_PROMOTED        = 'player_promoted',        // повышение игрока
    PLAYER_DEMOTED         = 'player_demoted',         // понижение игрока

    /* --- Прочее --- */
    CUSTOM                 = 'custom'                  // произвольное событие
}

/* ────────────────────────────────────────────────────────────── */
/*  Запись исторического журнала                                 */
/* ────────────────────────────────────────────────────────────── */

export interface IHistoryEvent extends IBaseEntity {
    /** Категория события (enum) */
    type: HistoryEventType;

    /** Заголовок события (Markdown) */
    title: string;

    /** Человеко-читаемое описание (Markdown) */
    description: string;

    /** Задействованные государства (JSON-массив UUID’ов) */
    state_uuids: string[] | null;

    /** Задействованные игроки */
    player_uuids: string[] | null;

    /** Задействованные альянсы */
    alliance_uuids: string[] | null;

    /** Связанная война (если применимо) */
    war_uuid: string | null;

    /** Связанный города (если применимо) */
    city_uuids: string[] | null;

    /** Дополнительные данные (произвольный JSON) */
    details_json: string | null;

    /** Автор записи (UUID игрока или админа) */
    created_by_uuid: string;
}
