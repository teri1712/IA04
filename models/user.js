import db from "../db.js";
import bcrypt from "bcrypt";
const saltRound = process.env.SALT_ROUND;
export default {
  getByUsername: async (username) => {
    return await db.oneOrNone('SELECT * FROM "Users" WHERE "username" = $1', [
      username,
    ]);
  },
  getById: async (id) => {
    return await db.oneOrNone('SELECT * FROM "Users" WHERE "id" = $1', [id]);
  },
  create: async (user) => {
    const salt = await bcrypt.genSalt(parseInt(saltRound));
    user.password = await bcrypt.hash(user.password, salt);
    user.permission = 1;
    return await db.none(
      'INSERT INTO "Users"("username", "password", "name", "email", "dob") VALUES ($1, $2, $3, $4, $5)',
      [user.username, user.password, user.name, user.email, user.dob]
    );
  },
  updateAvatar: async (user, avatar) => {
    await db.none('UPDATE "Users" SET "avatar_url"=$1 WHERE "id"=$2', [
      avatar,
      user.id,
    ]);
  },
  getAll: async () => {
    return await db.any('SELECT * FROM "Users"');
  },
};
