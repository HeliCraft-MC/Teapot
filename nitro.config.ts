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
                host:     process.env.MYSQL_HOST || '5.83.140.42',
                port:     Number(process.env.MYSQL_PORT) || 3306,
                user:     process.env.MYSQL_USER || 'ms0urVpn',
                password: process.env.MYSQL_PASSWORD || 'p`#1888zAUhsA{X/=',
                database: process.env.MYSQL_DATABASE || 'newAuth',
            }
        },
        states: {
            connector: 'mysql2',
            options: {
                host:     process.env.STATES_MYSQL_HOST || '5.83.140.42',
                port:     Number(process.env.STATES_MYSQL_PORT) || 3306,
                user:     process.env.STATES_MYSQL_USER || 'ms0urVpn',
                password: process.env.STATES_MYSQL_PASSWORD || 'p`#1888zAUhsA{X/=',
                database: process.env.STATES_MYSQL_DATABASE || 'states',
            }
        }
    },
    runtimeConfig: {
        jwtSecret: process.env.JWT_SECRET || 'secret',
        uploads: process.env.UPLOAD_DIR || 'uploads',
        sqliteSkinPath: process.env.SQLITE_PATH || 'db.sqlite',
    }
});
