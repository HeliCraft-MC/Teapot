export default defineNitroConfig({
    srcDir: 'server',
    experimental: {
        asyncContext: true,
        database: false,
        openAPI: true,
    },
    openAPI: {
        ui: {
            scalar: {
                theme: 'purple',
            },
        },
        meta: {
            title: 'HeliCraft Backend API',
            description: 'Backend API for HeliCraft project',
            version: '1.0',
        },
    },
    runtimeConfig: {
        // Git commit подставится в runtime, если прокинуть через NODE_COMMIT
        teapotCommit: '',
        jwtSecret: '',
        uploads: '',
        sqliteSkinPath: '',
        databaseDebug: false,
        database: {
            default: {
                options: {
                    host: '',
                    port: 0,
                    user: '',
                    password: '',
                    database: '',
                },
            },
            states: {
                options: {
                    host: '',
                    port: 0,
                    user: '',
                    password: '',
                    database: '',
                },
            },
        },
    },
})
