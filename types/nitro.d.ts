import type { Database } from 'bun:sqlite'
import type { Pool } from 'mysql2/promise'

declare module 'nitropack' {
    interface NitroApp {
        sqlite: Database,
        useMySQL: (connectionName: string) => Pool
    }
}