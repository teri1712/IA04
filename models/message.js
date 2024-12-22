import db from "../db.js";
import userDb from "./user.js";
export default {
  getByTime: async (from, to) => {
    const messages = await db.any(
      'SELECT * FROM "Messages" WHERE "at_time" BETWEEN $1 AND $2 ORDER BY "at_time" ASC;',
      [from, to]
    );
    for (let message of messages) {
      message.from = await userDb.getById(message.user_id);
    }
    return messages;
  },

  create: async (sender, content) => {
    return await db.none(
      'INSERT INTO "Messages"("user_id", "content","at_time") VALUES ($1, $2, $3);',
      [sender, content, new Date().getTime()]
    );
  },
};
