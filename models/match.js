import db from "../db.js";
export default {
  getAllMatches: async () => {
    return await db.any('SELECT * FROM "Match"');
  },
  get: async (id) => {
    return await db.oneOrNone('SELECT * FROM "Match" WHERE "id" = $1', [id]);
  },
  getByUser: async (id) => {
    return await db.oneOrNone('SELECT * FROM "Match" WHERE "user_id" = $1', [
      id,
    ]);
  },
  create: async (match) => {
    return await db.none(
      'INSERT INTO "Match"("user_id", "width","height","max_time","state","cells") VALUES ($1, $2, $3, $4, $5, $6)',
      [
        match.user_id,
        match.width,
        match.height,
        "waiting",
        match.max_time,
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
      'INSERT INTO "Players"("user_id", "match_id,"user_name") VALUES ($1, $2, $3)',
      [player.id, match_id, player.name]
    );
  },
  getPlayer: async (match_id, user_id) => {
    return await db.oneOrNone(
      'SELECT * FROM "Players" WHERE "match_id" = $1 AND "user_id" = $2',
      [match_id, user_id]
    );
  },
  getPartner: async (match_id, user_id) => {
    return await db.oneOrNone(
      'SELECT * FROM "Players" WHERE "match_id" = $1 AND AND "user_id" <> $2',
      [match_id, user_id]
    );
  },
  start: async (match_id, state) => {
    await db.none('UPDATE "Match" SET "state"=$1 WHERE "id"=$2', [
      state,
      match_id,
    ]);
  },
  updateMove: async (match_id, i, j, value, move) => {
    await db.none(
      'UPDATE "Match" SET cell[$1][$2] = $3, current_move =$4, move_time =$5 WHERE "id"=$6',
      [i, j, value, move.current_move, move.time, match_id]
    );
  },
};
