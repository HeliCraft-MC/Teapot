import { dirname } from 'pathe'
import { mkdirSync } from 'node:fs'
import SQLite from 'better-sqlite3'
import type { Database as SQLiteDatabase } from 'better-sqlite3'

// eslint-disable-next-line import/no-mutable-exports
let db!: SQLiteDatabase

export default defineNitroPlugin((nitroApp) => {
  // Путь к файлу БД для таблицы states
  const { sqliteStatesPath = './db/states.sqlite' } = useRuntimeConfig()

  // Убеждаемся, что директория для БД существует
  mkdirSync(dirname(sqliteStatesPath), { recursive: true })

  // Инициализируем соединение
  db = new SQLite(sqliteStatesPath)

  // Базовые PRAGMA-настройки для надёжности
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Авто-миграция: создаём таблицу states, если её нет
  console.log('SQLite: creating table states')
  db.exec(`
    CREATE TABLE IF NOT EXISTS states (
      uuid                         TEXT    PRIMARY KEY,
      name                         TEXT    NOT NULL,
      govForm                      TEXT    NOT NULL,
      description                  TEXT    NOT NULL,
      map_link                     TEXT    NOT NULL,
      flag_path                    TEXT    NOT NULL,
      creator_uuid                 TEXT    NOT NULL,
      ruler_uuid                   TEXT    NOT NULL,
      manager_uuids                TEXT    NOT NULL,  -- JSON array of UUIDs
      citizen_uuids                TEXT    NOT NULL,  -- JSON array of UUIDs
      applicant_uuids              TEXT    NOT NULL,  -- JSON array of UUIDs
      allow_other_citizenships     INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true
      created_at                   INTEGER DEFAULT (strftime('%s','now'))
    );
  `)

})

/**
 * Компонент для получения доступа к БД states из кода
 */
export function useStatesSQLite(): SQLiteDatabase {
  if (!db) {
    throw new Error('SQLite not initialised')
  }
  return db
}
