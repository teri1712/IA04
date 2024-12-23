import messageDb from "../../models/message.js";
import matchDb from "../../models/match.js";
import online_broker from "./online-broker.js";
import message_broker from "./message-broker.js";
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
    await matchDb.updateMove(match.id, match.user_id, new Date().getTime());

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
    await matchDb.updateCell(match.id, i, j, value);
    await matchDb.updateMove(
      match.id,
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
      this.end(match, "win");
    } else if (draw(match.cells)) {
      this.end(match, "draw");
    }
  },
  end: async (match, type) => {
    let viewers = active_viewers.get(match.user_id);
    if (!viewers) viewers = [];
    active_viewers.delete(match.user_id);

    const current_move = match.current_move;
    await matchDb.updateState(match.id, "end");

    const players = await matchDb.getPlayers(match.id);
    const partner = players[0].id == match.user_id ? players[1] : players[0];
    const emission = {
      id: match.id,
      type: "end",
      winner:
        type == "draw"
          ? undefined
          : current_move == partner.user_id
          ? match.user_id
          : partner.user_id,
    };
    let socket = online_broker.getUser(players[0].id);
    if (socket) {
      socket.emit("game", emission);
    }

    socket = online_broker.getUser(players[1].id);
    if (socket) {
      socket.emit("game", emission);
    }
    for (let viewer of await viewers) {
      socket = online_broker.getUser(viewer.user_id);
      if (socket) {
        socket.emit("game", emission);
      }
    }
  },
  message: async (user_id, from, message) => {
    const viewers = active_viewers.get(user_id);
    const match = await matchDb.getByUser(user_id);
    await messageDb.createMatchMessage(from, message, match.id);
    const emission = {
      type: "match",
      message: {
        content: message,
        from: from,
      },
    };

    const players = await matchDb.getPlayers(match.id);
    let socket = online_broker.getUser(players[0].id);
    if (socket) {
      socket.emit("message", emission);
    }
    socket = online_broker.getUser(players[1].id);
    if (socket) {
      socket.emit("message", emission);
    }
    for (let viewer of viewers) {
      const socket = online_broker.getUser(viewer.id);
      if (socket) {
        socket.emit("message", emission);
      }
    }
  },
};

setInterval(async () => {
  const matches = await matchDb.getTimeOut();
  for (let match of matches) {
    match_broker.end(match, "win");
    console.log("enddddddddddddddddddddddddddddd");
  }
}, 1000);
export default match_broker;
