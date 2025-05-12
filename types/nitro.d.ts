// types/nitro.d.ts
import type { Pool } from 'mysql2/promise';
import type { NitroApp } from 'nitropack';

declare module 'nitropack' {
    interface NitroApp {
        /** Пул соединений MySQL */
        mysqlPool: Pool;
    }
}
