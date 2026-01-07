//https://nitro.unjs.io/config
export default defineNitroConfig({
    srcDir: "server",
    compatibilityDate: '2026-01-07',
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
    preset: 'bun',
    externals: {
        inline: ['bun:sqlite']
    },
    runtimeConfig: {
        teapotCommit: process.env.NODE_COMMIT_TEAPOT || 'unknown',
        jwtSecret: 'supersecret',
        uploads: 'public/uploads',
        sqliteSkinPath: 'data/sqlite.db',
        databaseDebug: false,
        telegramBotToken: '000000000:aaaaaaaaaaaaaaaaaaaaaaaa',
        telegramChatId: '00000000',
        telegramThreadId: '0',
        telegramTopicSkins: '0',
        publicApiUrl: 'http://localhost:3000',
        database: {
            default: {
                options: {
                    host: '127.0.0.1',
                    port: 3306,
                    user: 'user',
                    password: 'pass',
                    database: 'defaultDb',
                }
            },
            states: {
                options: {
                    host: '127.0.0.1',
                    port: 3306,
                    user: 'user',
                    password: 'pass',
                    database: 'statesDb',
                }
            },
            banlist: {
                options: {
                    host: '127.0.0.1',
                    port: 3306,
                    user: 'user',
                    password: 'pass',
                    database: 'banlistDb',
                }
            }
        },
    }
});
