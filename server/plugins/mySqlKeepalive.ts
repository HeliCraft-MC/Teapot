// server/plugins/mySqlKeepalive.ts
export default defineNitroPlugin(() => {

    const names = ['default', 'states']
    setInterval(async () => {
        for (const n of names) {
            try {
                await useDatabase(n).sql`SELECT 1`
            } catch (e) {
                console.error(`[db-keepalive] ${n}:`, e)
            }
        }
    }, 55_000)
})
