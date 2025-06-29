import dotenv from 'dotenv'
// Загружаем переменные из .env (для локальной разработки)
dotenv.config()

// Плагин для динамической подстановки env-переменных
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  // Общие переменные
  config.teapotCommit = process.env.NODE_COMMIT || config.teapotCommit
  config.jwtSecret = process.env.JWT_SECRET || config.jwtSecret
  config.uploads = process.env.UPLOAD_DIR || config.uploads
  config.sqliteSkinPath = process.env.SQLITE_PATH || config.sqliteSkinPath
  config.databaseDebug =
    process.env.DATABASE_DEBUG !== undefined
      ? process.env.DATABASE_DEBUG === 'true'
      : config.databaseDebug

  // Основная БД
  config.database!.default!.options.host =
    process.env.MYSQL_HOST || config.database!.default!.options.host
  config.database!.default!.options.port =
    process.env.MYSQL_PORT
      ? Number(process.env.MYSQL_PORT)
      : config.database!.default!.options.port
  config.database!.default!.options.user =
    process.env.MYSQL_USER || config.database!.default!.options.user
  config.database!.default!.options.password =
    process.env.MYSQL_PASSWORD || config.database!.default!.options.password
  config.database!.default!.options.database =
    process.env.MYSQL_DATABASE || config.database!.default!.options.database

  // БД статусов
  config.database!.states!.options.host =
    process.env.STATES_MYSQL_HOST || config.database!.states!.options.host
  config.database!.states!.options.port =
    process.env.STATES_MYSQL_PORT
      ? Number(process.env.STATES_MYSQL_PORT)
      : config.database!.states!.options.port
  config.database!.states!.options.user =
    process.env.STATES_MYSQL_USER || config.database!.states!.options.user
  config.database!.states!.options.password =
    process.env.STATES_MYSQL_PASSWORD || config.database!.states!.options.password
  config.database!.states!.options.database =
    process.env.STATES_MYSQL_DATABASE || config.database!.states!.options.database
})
