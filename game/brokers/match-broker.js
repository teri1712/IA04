import { v4 as uuidv4 } from "uuid";
import matchDb from "../../models/match.js";
import online_broker from "./online-broker";
const active_matches = new Map();

function checkRow(cells) {
  for (let i = 0; i < 3; i++) {
    if (
      cells[i][0] != 0 &&
      cells[i][0] == cells[i][1] &&
      cells[i][1] == cells[i][2]
    ) {
      return true;
    }
  }
  return false;
}

function checkCol(cells) {
  for (let i = 0; i < 3; i++) {
    if (
      cells[0][i] != 0 &&
      cells[0][i] == cells[1][i] &&
      cells[1][i] == cells[2][i]
    ) {
      return true;
    }
  }
  return false;
}

function checkDiag(cells) {
  if (
    cells[0][0] != 0 &&
    cells[0][0] == cells[1][1] &&
    cells[1][1] == cells[2][2]
  ) {
    return true;
  }
  if (
    cells[0][2] != 0 &&
    cells[0][2] == cells[1][1] &&
    cells[1][1] == cells[2][0]
  ) {
    return true;
  }
  return false;
}

function draw(cells) {}

const match_broker = {
  open: async (player, config) => {
    if (await matchDb.getByUser(player.id)) {
      throw new Error("You already have a match");
    }
    let match = {};
    match.user_id = player.id;
    match.width = config.width;
    match.height = config.height;
    match.max_time = config.max_time;
    await matchDb.create();
    match = await matchDb.getByUser(player.id);

    player.role = "player";
    await matchDb.addPlayer(match.id, player);
  },
  start: async (owner, player) => {
    const match = await matchDb.getByUser(owner.id);
    player.role = "player";
    await matchDb.addPlayer(match.id, player);
  },
  join: async (player, id) => {
    const match = await matchDb.get(id);
    const players = await matchDb.getPlayers(id);
    await matchDb.addPlayer(match.id, player);
    player.role = "viewer";
    for (let player of players) {
      const socket = online_broker.getUser(player.user_id);
      if (socket) {
        socket.emit("game", {
          type: "join",
          id: id,
          first_player: match.first_player,
          second_player: match.second_player,
        });
      }
    }
  },
  move: async (match_id, player_id, i, j) => {
    const match = await matchDb.get(match_id);
    const current_move = match.current_move;

    const value = current_move == match.user_id ? 1 : 2;
    match.cells[i][j] = value;
    match.current_move = value == 1 ? partner.user_id : match.user_id;

    await matchDb.updateMove(match.id, i, j, value, {
      current_move: match.current_move,
      time: new Date().getTime(),
    });

    for (let player of await matchDb.getPlayers(match.id)) {
      const socket = online_broker.getUser(player.user_id);
      if (socket) {
        socket.emit("game", {
          id: match_id,
          type: "move",
          i: i,
          j: j,
          value: value == 1 ? "X" : "O",
        });
      }
    }
    if (
      !(
        checkRow(match.cells) ||
        checkCol(match.cells) ||
        checkDiag(match.cells)
      )
    ) {
      end(match, "win");
    } else if (draw(match.cells)) {
      end(match, "draw");
    } else {
      setTimeout(async () => {
        this.timeOutCheck(match.id);
      }, match.max_time * 1000);
    }
  },
  timeOutCheck: async (id) => {
    const current_time = new Date().getTime();
    const match = await matchDb.get(id);
    if (match.state != "start") {
      return;
    }
    if (current_time - match.move_time >= match.max_time) {
      this.end(match, "win");
    }
  },
  end: async (match, type) => {
    const current_move = match.current_move;
    for (let player of await matchDb.getPlayers(match.id)) {
      const socket = online_broker.getUser(player.user_id);
      if (socket) {
        socket.emit("game", {
          id: match.id,
          type: "end",
          winner: type == "draw" ? undefined : current_move,
        });
      }
    }
  },
};
export default match_broker;
