//https://nitro.unjs.io/config
import dotenv from 'dotenv'
dotenv.config()
export default defineNitroConfig({
  srcDir: "server",
    runtimeConfig: {
      mysqlHost:   process.env.MYSQL_HOST   || 'localhost',
          mysqlPort:   Number(process.env.MYSQL_PORT) || 3306,
          mysqlUser:   process.env.MYSQL_USER   || 'root',
          mysqlPassword: process.env.MYSQL_PASSWORD || '',
          mysqlDatabase: process.env.MYSQL_DATABASE || 'mydb'
    },
    plugins: ["~/plugins/mysql2.plugin.ts"]
});
