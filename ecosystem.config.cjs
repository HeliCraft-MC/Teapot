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
                
                MYSQL_HOST: process.env.MYSQL_HOST,
                MYSQL_PORT: process.env.MYSQL_PORT,
                MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
                MYSQL_DATABASE: process.env.MYSQL_DATABASE,
                
                STATES_MYSQL_HOST: process.env.STATES_MYSQL_HOST,
                STATES_MYSQL_PORT: process.env.STATES_MYSQL_PORT,
                STATES_MYSQL_USER: process.env.STATES_MYSQL_USER,
                STATES_MYSQL_PASSWORD: process.env.STATES_MYSQL_PASSWORD,
                STATES_MYSQL_DATABASE: process.env.STATES_MYSQL_DATABASE,
                
                JWT_SECRET: process.env.JWT_SECRET,
                UPLOAD_DIR: process.env.UPLOAD_DIR,
                SQLITE_PATH: process.env.SQLITE_PATH,
            }
        }
    ]
}
