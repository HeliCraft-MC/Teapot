import mysql from 'mysql2/promise';

let connections: { [key: string]: mysql.Pool } = {};

/**
 * Retrieves a MySQL connection pool by its name.
 *
 * @param {string} connectionName - The name of the MySQL connection to retrieve.
 * @return {mysql.Pool} The MySQL connection pool associated with the given name.
 * @throws {Error} If the connection with the specified name does not exist.
 */
export function useMySQL(connectionName: string): mysql.Pool {
    if (!connections[connectionName]) {
        throw new Error(`MySQL connection "${connectionName}" not found.`);
    }
    return connections[connectionName];
}

export default defineNitroPlugin(async (nitro) => {
    const config = useRuntimeConfig().database;
    const connectionsNames = Object.keys(config);
    console.log("[MySQL Plugin] Initializing " + connectionsNames.length + " MySQL connections...");

    for (const connection of connectionsNames) {
        try {
            const pool = mysql.createPool({
                host: config[connection].options.host,
                port: config[connection].options.port,
                user: config[connection].options.user,
                password: config[connection].options.password,
                database: config[connection].options.database,
                waitForConnections: true,
                connectionLimit: 10,
                idleTimeout: 10000,
                enableKeepAlive: true,
                keepAliveInitialDelay: 0,
            });

            // Test connection to database
            const conn = await pool.getConnection();
            conn.release();

            connections[connection] = pool;

            console.log(`[MySQL Plugin] Connection ${connection} initialized.`);
        } catch (err) {
            console.error(`[MySQL Plugin] Error initializing connection ${connection}:`, err);
            throw new Error(`Failed to initialize MySQL connection "${connection}": ${err.message}`);
        }
    }

    console.log("[MySQL Plugin] Connected to " + Object.keys(connections).length + " databases.");

    nitro.useMySQL = useMySQL;

    nitro.hooks.hook("close", async () => {
        console.log("[MySQL Plugin] Closing MySQL connections...");
        for (const connectionName in connections) {
            try {
                await connections[connectionName].end();
                console.log(`[MySQL Plugin] Connection ${connectionName} closed.`);
            } catch (err) {
                console.error(`[MySQL Plugin] Error closing connection ${connectionName}:`, err);
            }
        }
        connections = {};
        console.log("[MySQL Plugin] All MySQL connections closed.");
    })

});

