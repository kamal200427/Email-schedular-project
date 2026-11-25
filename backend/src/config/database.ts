
import knex, { Knex } from "knex";

import { env } from "./env";

const databaseConfig: Knex.Config = {
  client: "mysql2",

  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: "utf8mb4",
  },

  pool: {
    min: 2,
    max: 10,

    acquireTimeoutMillis: 30000,

    idleTimeoutMillis: 30000,

    reapIntervalMillis: 1000,
  },

  migrations: {
    directory: "../database/migrations",
    extension: "ts",
  },

  seeds: {
    directory: "../database/seeds",
    extension: "ts",
  },

  debug: env.NODE_ENV === "development",
};

const db = knex(databaseConfig);

// Check database connectivity.
export const checkDatabaseConnection = async (): Promise<void> => {
  try {
    await db.raw("SELECT 1");

    console.log("MySQL database connected successfully.");
  } catch (error) {
    console.error("MySQL connection failed:", error);

    throw error;
  }
};

// Close database connection.
export const closeDatabaseConnection = async (): Promise<void> => {
  await db.destroy();

  console.log("MySQL connection closed.");
};

export default db;
