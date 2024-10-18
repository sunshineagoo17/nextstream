require('dotenv').config();

const sharedConfig = {
    client: 'mysql2',
    migrations: {
        tableName: 'knex_migrations',
        directory: './migrations',
    },
    seeds: {
        directory: './seeds',
    },
};

module.exports = {
    development: {
        ...sharedConfig,
        connection: {
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'my_database',
            charset: 'utf8mb4',
        },
        debug: true,
    },

    production: {
        ...sharedConfig,
        connection: process.env.JAWSDB_URL, 
        debug: false,
    },
};