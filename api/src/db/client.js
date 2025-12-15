import mysql from "mysql2/promise";

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

const required = { DB_HOST, DB_PORT, DB_USER, DB_NAME };
const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  throw new Error(
    `Missing required DB env vars: ${missing.join(
      ", "
    )}. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD (can be empty), DB_NAME.`
  );
}

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
