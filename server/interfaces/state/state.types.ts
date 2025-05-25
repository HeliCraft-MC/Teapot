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
    colorHex: string;

    /** Форма правления */
    govForm: GovernmentForm;

    /** Есть ли в государстве выборы */
    hasElections: boolean;

    /** Текущий статус существования */
    status: StateStatus;

    /** UUID столицы (может отсутствовать до назначения) */
    capitalUuid: string | null;

    /** Ссылка на внешнюю карту (BlueMap и т. д.) */
    mapLink: string | null;

    /** Приглашение в Telegram-чат */
    telegramLink: string | null;

    /** Основатель (UUID игрока) */
    creatorUuid: string;

    /** Действующий правитель (UUID игрока) */
    rulerUuid: string;

    /** Разрешено ли двойное гражданство */
    allowDualCitizenship: boolean;

    /** Возможен ли свободный вход на территорию */
    freeEntry: boolean;

    /** Детали политики свободного входа */
    freeEntryDescription: string | null;

    /** URL к файлу флага */
    flagLink: string;
}


/**
 * Выпущенные ордеры на арест/исполнение наказания от государства.
 */
export interface IStateWarrant extends IBaseEntity {
    /** UUID государства, выдавшего */
    stateUuid: string;

    /** UUID игрока, на которого выдан ордер */
    affectedPlayerUuid: string;

    /** Причина ареста */
    reason: string;

    /** UUID игрока, которым выдан ордер */
    issuedByPlayerUuid: string;

    /** Выполнены ли какие-либо действия администрацией */
    actionsTakenByAdmins: boolean;

    /** Какие именно */
    actionsByAdminsDetails: string | null;

    /** Выполнены ли какие-либо действия государством */
    actionsTakenByState: boolean;

    /** Какие именно */
    actionsByStateDetails: string | null;
}

/**
 * Выпущенные государством указы.
 */
export interface IStateOrder extends IBaseEntity {
    /** UUID государства, выпустившего указ */
    stateUuid: string;

    /** Заголовок указа */
    title: string;

    /** Текст указа */
    text: string;

    /** Дата и время публикации */
    publishedAt: number;

    /** UUID игрока, выпустившего указ */
    issuedByPlayerUuid: string;

    /** Важность указа \ максимально 5 закрепленных */
    importance: 'pinned' | 'high' | 'medium' | 'low';

    /** Действует ли указ в данный момент */
    isActive: boolean;

    /** Дата и время окончания действия (может быть null) */
    expiresAt: number | null;
}

/**
 * Гражданство/членство в государстве (многие-ко-многим).
 */
export interface IStateMember extends IBaseEntity {
    /** Государство */
    stateUuid: string;

    /** Город прописки (может быть null) */
    cityUuid: string | null;

    /** UUID игрока */
    playerUuid: string;

    /** Роль, определяющая права */
    role: RolesInState;
}
