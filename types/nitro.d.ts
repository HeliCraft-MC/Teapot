import type { Database } from 'better-sqlite3'

declare module 'nitropack' {
    interface NitroApp {
        sqlite: Database
    }
}