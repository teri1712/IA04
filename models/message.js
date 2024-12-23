import db from "../db.js";
import userDb from "./user.js";
export default {
  getAll: async () => {
    const messages = await db.any(
      'SELECT * FROM "Messages" ORDER BY "at_time" ASC;'
    );
    for (let message of messages) {
      message.from = message.user_name;
    }
    return messages;
  },
  getAllMatchMessages: async (match_id) => {
    const messages = await db.any(
      'SELECT * FROM "MatchMessages" WHERE "match_id"=$1 ORDER BY "at_time" ASC;',
      [match_id]
    );
    for (let message of messages) {
      message.from = message.user_name;
    }
    return messages;
  },
  create: async (sender, content) => {
    return await db.none(
      'INSERT INTO "Messages"("user_id","user_name", "content","at_time") VALUES ($1, $2, $3, $4);',
      [sender, sender.name, content, new Date().getTime()]
    );
  },
  createMatchMessage: async (sender, content, match_id) => {
    return await db.none(
      'INSERT INTO "MatchMessages"("user_name", "content","at_time","match_id") VALUES ($1, $2, $3, $4);',
      [sender, content, new Date().getTime(), match_id]
    );
  },
};
