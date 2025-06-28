module.exports = {
    apps: [
        {
            name: 'HeliCraft-Teapot',
            exec_mode: 'cluster',
            instances: '2',
            script: './.output/server/index.mjs',
            env: {
                NODE_ENV: 'production',
                PORT: 3300,
            }
        }
    ]
}
