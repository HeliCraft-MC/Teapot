//https://nitro.unjs.io/config
import dotenv from 'dotenv'
dotenv.config()
export default defineNitroConfig({
    srcDir: "server",
    experimental: {
        asyncContext: true,
        database: true
    },
    database: {
        default: {
            connector: 'mysql2',
            options: {
                host:     process.env.MYSQL_HOST || 'localhost',
                port:     Number(process.env.MYSQL_PORT) || 3306,
                user:     process.env.MYSQL_USER || 'root',
                password: process.env.MYSQL_PASSWORD || 'password',
                database: process.env.MYSQL_DATABASE || 'auth',
            }
        }
    },
    runtimeConfig: {
        uploads: process.env.UPLOAD_DIR || 'uploads',
        sqlitePath: process.env.SQLITE_PATH || 'db.sqlite',
    }
});
