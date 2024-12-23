import messageDb from "../../models/message.js";
import matchDb from "../../models/match.js";
import online_broker from "./online-broker.js";
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
const active_viewers = new Map();
const match_broker = {
  open: async (player, max_time) => {
    if (await matchDb.getByUser(player.id)) {
      throw new Error("Bạn đã có trận đáu rồi");
    }
    await matchDb.create({
      user_id: player.id,
      owner_name: player.name,
      max_time: max_time,
    });
    const match = await matchDb.getByUser(player.id);

    await matchDb.addPlayer(match.id, player);
  },
  start: async (owner, player) => {
    const match = await matchDb.getByUser(owner.id);
    await matchDb.addPlayer(match.id, player);
    await matchDb.updateState(match.id, "start");
    active_viewers.set(match.user_id, []);
  },
  join: (player, user_id) => {
    let viewers = active_viewers.get(user_id);
    if (!viewers) {
      viewers = [];
      active_viewers.set(user_id, viewers);
    }
    viewers.push(player);
  },
  move: async (match_id, player_id, i, j) => {
    const match = await matchDb.get(match_id);
    const players = await matchDb.getPlayers(match_id);
    const current_move = match.current_move;

    const value = current_move == match.user_id ? 1 : 2;
    match.cells[i][j] = value;
    match.current_move = value == 1 ? player_id : match.user_id;

    await matchDb.updateMove(
      match.id,
      i,
      j,
      value,
      match.current_move,
      new Date().getTime()
    );

    const emission = {
      id: match_id,
      type: "move",
      i: i,
      j: j,
      value: value,
    };

    let socket = online_broker.getUser(players[0].user_id);
    if (socket) {
      socket.emit("game", emission);
    }
    socket = online_broker.getUser(players[1].user_id);
    if (socket) {
      socket.emit("game", emission);
    }

    let viewers = active_viewers.get(match.user_id);
    if (!viewers) viewers = [];
    for (let viewer of viewers) {
      socket = online_broker.getUser(viewer.id);
      if (socket) {
        socket.emit("game", emission);
      }
    }

    if (
      !(
        checkRow(match.cells) ||
        checkCol(match.cells) ||
        checkDiag(match.cells)
      )
    ) {
      this.end(match_id, "win");
    } else if (draw(match.cells)) {
      this.end(match_id, "draw");
    }
  },
  end: async (match_id, type) => {
    const the_match = active_viewers.get(match.user_id);
    the_match.end = true;
    active_viewers.delete(match.user_id);

    const match = await matchDb.get(match_id);
    const partner = await matchDb.getPartner(match_id, match.user_id);

    const current_move = match.current_move;
    for (let player of await the_match) {
      const socket = online_broker.getUser(player.user_id);
      if (socket) {
        socket.emit("game", {
          id: match.id,
          type: "end",
          winner:
            type == "draw"
              ? undefined
              : current_move == partner.user_id
              ? match.user_id
              : partner.user_id,
        });
      }
    }
  },
  message: async (user_id, from, message) => {
    const the_match = active_viewers.get(user_id);
    const match = matchDb.getByUser(user_id);
    if (!match) {
      throw new Error("Trận đáu không tồn tại.");
    }
    if (!the_match) {
      throw new Error("Trận đáu đã kết thúc.");
    }
    messageDb.createMatchMessage(from, message, match.id);
    for (let player of the_match) {
      const socket = online_broker.getUser(player.id);
      if (socket) {
        socket.emit("message", {
          type: "match",
          message: {
            content: message,
            from: from,
          },
        });
      }
    }
  },
};

setTimeout(async () => {
  const current_time = new Date().getTime();
  if (viewers.end) {
    return;
  }
  if (current_time - match.move_time >= match.max_time) {
    this.end(match_id, "win");
  }
}, 1000);
export default match_broker;
