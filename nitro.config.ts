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
                url: process.env.DATABASE_URL || 'mysql://ms0urVpn:p`#1888zAUhsA{X/=@5.83.140.42:3306/newAuth'
            }
        }
    }
});
