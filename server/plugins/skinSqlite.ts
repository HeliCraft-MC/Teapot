import { dirname } from 'pathe'
import { mkdirSync } from 'node:fs'
import SQLite from 'better-sqlite3'
import type { Database as SQLiteDatabase } from 'better-sqlite3'

// eslint-disable-next-line import/no-mutable-exports
let db!: SQLiteDatabase

export default defineNitroPlugin((nitroApp) => {
  const { sqliteSkinPath = './db/skins.sqlite' } = useRuntimeConfig()

  // Гарантируем существование директории, где будет лежать БД
  mkdirSync(dirname(sqliteSkinPath), { recursive: true })

  // В предыдущей версии передавался неверный option { nativeBinding: true }.
  // Если custom-binding не нужен — оставляем конструктор без опций.
  db = new SQLite(sqliteSkinPath)

  // Базовые PRAGMA-настройки
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Авто-миграция (таблица skins)
  console.log('SQLite: creating table skins')
  db.exec(`
    CREATE TABLE IF NOT EXISTS skins (
      uuid     TEXT PRIMARY KEY,
      path     TEXT NOT NULL,
      mime     TEXT NOT NULL,
      size     INTEGER,
      created  INTEGER DEFAULT (CURRENT_TIMESTAMP)
    );
  `)

  // Публикуем экземпляр в контексте Nitro
  nitroApp.sqlite = db
})

export function useSkinSQLite(): SQLiteDatabase {
  if (!db) {
    throw new Error('SQLite not initialised')
  }
  return db
}