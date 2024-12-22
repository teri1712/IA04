import db from "../db.js";
export default {
  getById: async (id) => {
    return await db.oneOrNone(
      'SELECT * FROM "Clients" WHERE "client_id" = $1',
      [id]
    );
  },
  getByUser: async (user) => {
    return await db.oneOrNone('SELECT * FROM "Clients" WHERE "user_id" = $1', [
      user.id,
    ]);
  },
  create: async (client) => {
    return await db.none(
      'INSERT INTO "Clients"("client_id", "client_secret","redirect_uri","user_id") VALUES ($1, $2, $3, $4)',
      [
        client.client_id,
        client.client_secret,
        client.redirect_uri,
        client.user_id,
      ]
    );
  },

  updateUri: async (client, uri) => {
    await db.none(
      'UPDATE "Clients" SET "redirect_uri"=$1 WHERE "client_id"=$2',
      [uri, client.client_id]
    );
  },
};
