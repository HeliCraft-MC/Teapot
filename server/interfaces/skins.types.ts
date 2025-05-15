/** Метаданные скина, лежащие в SQLite */
export interface SkinMeta {
    /** UUID владельца (primary key) */
    uuid: string
    /** Относительный путь, например "skins/ab/cd/ef/<uuid>.png" */
    path: string
    /** MIME-тип, обычно image/png */
    mime: string
    /** Размер файла в байтах */
    size: number
    /** Unix-время создания */
    created: number
}
