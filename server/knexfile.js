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
            port: process.env.DB_PORT || 3306,
            ssl: process.env.SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: false } : false,
        },
        debug: true,
    },

    production: {
        ...sharedConfig,
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            ssl: process.env.SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: false } : false,
        },
        debug: false,
    },
};