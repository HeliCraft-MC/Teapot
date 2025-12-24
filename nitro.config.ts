//https://nitro.unjs.io/config
import dotenv from 'dotenv'
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

export default defineNitroConfig({
    srcDir: "server",
    imports: {
        autoImport: true
    },
    experimental: {
        asyncContext: true,
        database: false,
        openAPI: true,
    },
    openAPI: {
        ui: {
            scalar: {
                theme: 'purple'
            }
        },
        meta: {
            title: 'HeliCraft Backend API',
            description: 'Backend API for HeliCraft project',
            version: '1.0'
        }
    },
    runtimeConfig: {
        teapotCommit: process.env.NODE_COMMIT_TEAPOT || 'unknown',
        jwtSecret: process.env.JWT_SECRET,
        uploads: process.env.UPLOAD_DIR,
        sqliteSkinPath: process.env.SQLITE_PATH,
        databaseDebug: Boolean(process.env.DATABASE_DEBUG) || false,
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
        telegramChatId: process.env.TELEGRAM_CHAT_ID,
        telegramThreadId: process.env.TELEGRAM_THREAD_ID,
        telegramTopicSkins: process.env.TELEGRAM_TOPIC_SKINS,
        publicApiUrl: process.env.PUBLIC_API_URL,
        database: {
            default: {
                options: {
                    host: process.env.MYSQL_HOST,
                    port: Number(process.env.MYSQL_PORT),
                    user: process.env.MYSQL_USER,
                    password: process.env.MYSQL_PASSWORD,
                    database: process.env.MYSQL_DATABASE,
                }
            },
            states: {
                options: {
                    host: process.env.STATES_MYSQL_HOST,
                    port: Number(process.env.STATES_MYSQL_PORT),
                    user: process.env.STATES_MYSQL_USER,
                    password: process.env.STATES_MYSQL_PASSWORD,
                    database: process.env.STATES_MYSQL_DATABASE,
                }
            }
        },
    }
});
