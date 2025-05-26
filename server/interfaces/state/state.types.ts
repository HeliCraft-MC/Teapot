import { IBaseEntity } from './common.types';

/* ────────────────────────────────────────────────────────────── */
/*  Перечисления, описывающие государство и роли                  */
/* ────────────────────────────────────────────────────────────── */

/** Жизненный цикл государства */
export enum StateStatus {
    /** Создано, ожидает одобрения админом */
    PENDING   = 'pending',
    /** Полностью функционирует */
    ACTIVE    = 'active',
    /** Заявка отклонена */
    REJECTED  = 'rejected',
    /** Объединено с другим государством */
    MERGED    = 'merged',
    /** Распущено / заброшено */
    DISSOLVED = 'dissolved'
}

/** Форма правления (ролевая характеристика) */
export enum GovernmentForm {
    MONARCHY   = 'monarchy',   // монархия
    REPUBLIC   = 'republic',   // республика
    FEDERATION = 'federation', // федерация
    OLIGARCHY  = 'oligarchy',  // олигархия / совет
    TRIBAL     = 'tribal',     // племенное устройство
    OTHER      = 'other'       // иное / смешанное
}

/** Роли граждан внутри государства */
export enum RolesInState {
    RULER     = 'ruler',      // глава государства
    VICE_RULER = 'vice_ruler', // заместитель главы - все права, кроме назначения нового главы и роспуска государства
    MINISTER  = 'minister',   // модератор / министр - может назначать чиновников, выпускать ордера, принимать новых граждан
    DIPLOMAT = 'diplomat',  // дипломат - может выполнять дипломатические действия
    OFFICER   = 'officer',    // офицер / военный - может арестовывать игроков и выпускать ордера
    CITIZEN   = 'citizen',    // полноправный гражданин
    APPLICANT = 'applicant'   // подавший заявку
}

/* ────────────────────────────────────────────────────────────── */
/*  Государственные сущности                                     */
/* ────────────────────────────────────────────────────────────── */

/**
 * Основная политическая единица, контролируемая игроками.
 */
export interface IState extends IBaseEntity {
    /** Официальное название */
    name: string;

    /** Краткое описание / конституция */
    description: string;

    /** Фирменный цвет (#RRGGBB) */
    color_hex: string;

    /** Форма правления */
    gov_form: GovernmentForm;

    /** Есть ли в государстве выборы */
    has_elections: boolean;

    /** Текущий статус существования */
    status: StateStatus;

    /** UUID столицы (может отсутствовать до назначения) */
    capital_uuid: string | null;

    /** Ссылка на внешнюю карту (BlueMap и т. д.) */
    map_link: string | null;

    /** Приглашение в Telegram-чат */
    telegram_link: string | null;

    /** Основатель (UUID игрока) */
    creator_uuid: string;

    /** Действующий правитель (UUID игрока) */
    ruler_uuid: string;

    /** Разрешено ли двойное гражданство */
    allow_dual_citizenship: boolean;

    /** Возможен ли свободный вход на территорию */
    free_entry: boolean;

    /** Детали политики свободного входа */
    free_entry_description: string | null;

    /** URL к файлу флага */
    flag_link: string;
}


/**
 * Выпущенные ордеры на арест/исполнение наказания от государства.
 */
export interface IStateWarrant extends IBaseEntity {
    /** UUID государства, выдавшего */
    state_uuid: string;

    /** UUID игрока, на которого выдан ордер */
    affected_player_uuid: string;

    /** Причина ареста */
    reason: string;

    /** UUID игрока, которым выдан ордер */
    issued_by_player_uuid: string;

    /** Выполнены ли какие-либо действия администрацией */
    actions_taken_by_admins: boolean;

    /** Какие именно */
    actions_by_admins_details: string | null;

    /** Выполнены ли какие-либо действия государством */
    actions_taken_by_state: boolean;

    /** Какие именно */
    actions_by_state_details: string | null;
}

/**
 * Выпущенные государством указы.
 */
export interface IStateOrder extends IBaseEntity {
    /** UUID государства, выпустившего указ */
    state_uuid: string;

    /** Заголовок указа */
    title: string;

    /** Текст указа */
    text: string;

    /** Дата и время публикации */
    published_at: number;

    /** UUID игрока, выпустившего указ */
    issued_by_player_uuid: string;

    /** Важность указа \ максимально 5 закрепленных */
    importance: 'pinned' | 'high' | 'medium' | 'low';

    /** Действует ли указ в данный момент */
    is_active: boolean;

    /** Дата и время окончания действия (может быть null) */
    expires_at: number | null;
}

/**
 * Гражданство/членство в государстве (многие-ко-многим).
 */
export interface IStateMember extends IBaseEntity {
    /** Государство */
    state_uuid: string;

    /** Город прописки (может быть null) */
    city_uuid: string | null;

    /** UUID игрока */
    player_uuid: string;

    /** Роль, определяющая права */
    role: RolesInState;
}
