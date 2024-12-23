import db from "../db.js";
export default {
  getAllMatches: async () => {
    return await db.any('SELECT * FROM "Match"');
  },
  get: async (id) => {
    return await db.oneOrNone('SELECT * FROM "Match" WHERE "id" = $1', [id]);
  },
  getTimeOut: async () => {
    const current_time = new Date().getTime();
    return await db.any(
      'SELECT * FROM "Match" WHERE "state" = $1 AND "move_time" + "max_time" < $2',
      ["start", current_time]
    );
  },
  getByUser: async (id) => {
    return await db.oneOrNone(
      'SELECT * FROM "Match" WHERE "user_id" = $1 AND "state" != $2',
      [id, "end"]
    );
  },
  create: async (match) => {
    return await db.none(
      'INSERT INTO "Match"("user_id","owner_name", "max_time","state","current_move","cells") VALUES ($1, $2, $3, $4, $5, $6)',
      [
        match.user_id,
        match.owner_name,
        parseInt(match.max_time) * 1000,
        "waiting",
        match.user_id,
        [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
      ]
    );
  },
  addPlayer: async (match_id, player) => {
    return await db.none(
      'INSERT INTO "Players"("user_id", "match_id", "name") VALUES ($1, $2, $3)',
      [player.id, match_id, player.name]
    );
  },
  getPlayer: async (match_id, user_id) => {
    return await db.oneOrNone(
      'SELECT * FROM "Players" WHERE "match_id" = $1 AND "user_id" = $2',
      [match_id, user_id]
    );
  },
  getPlayers: async (match_id) => {
    return await db.any('SELECT * FROM "Players" WHERE "match_id" = $1', [
      match_id,
    ]);
  },
  getPartner: async (match_id, user_id) => {
    return await db.oneOrNone(
      'SELECT * FROM "Players" WHERE "match_id" = $1 AND "user_id" != $2',
      [match_id, user_id]
    );
  },
  updateCell: async (match_id, i, j, value) => {
    await db.none('UPDATE "Match" SET cell[$1][$2] = $3 WHERE "id"=$4', [
      i,
      j,
      value,
      match_id,
    ]);
  },
  updateMove: async (match_id, current_move, move_time) => {
    await db.none(
      'UPDATE "Match" SET "current_move"=$1, "move_time"=$2 WHERE "id"=$3',
      [current_move, move_time, match_id]
    );
  },
  updateState: async (match_id, state) => {
    await db.none('UPDATE "Match" SET "state" =$1 WHERE "id"=$2', [
      state,
      match_id,
    ]);
  },
};
