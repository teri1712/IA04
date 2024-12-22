import dotenv from "dotenv";
dotenv.config();

import pgPromise from "pg-promise";

const pgp = pgPromise({
  capSQL: true,
  schema: process.env.DB_SCHEMA,
});
const db = pgp({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

export default db;
