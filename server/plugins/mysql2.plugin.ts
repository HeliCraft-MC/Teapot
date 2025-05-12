// server/plugins/mysql.ts
import mysql from 'mysql2/promise'

export default defineNitroPlugin((nitroApp) => {
    const { mysqlHost, mysqlPort, mysqlUser, mysqlPassword, mysqlDatabase } = useRuntimeConfig()
    const pool = mysql.createPool({
        host:     mysqlHost,
        port:     mysqlPort,
        user:     mysqlUser,
        password: mysqlPassword,
        database: mysqlDatabase,
        waitForConnections: true,
        connectionLimit:    10,
        queueLimit:         0
    })

    // Кладём пул в контекст Nitro
    console.log("Pool created")
    nitroApp.mysqlPool = pool

    // Корректно закрываем пул при завершении процесса
    nitroApp.hooks.hookOnce('close', async () => {
        await pool.end()
    })
})
