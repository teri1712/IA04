import { v4 as uuidv4 } from "uuid";
import online_broker from "./online-broker";
const active_matches = new Map();

function checkRow(cells) {
  for (let i = 0; i < 3; i++) {
    if ((cells[i][0] == cells[i][1]) & (cells[i][1] == cells[i][2])) {
      return true;
    }
  }
  return false;
}

function checkCol(cells) {
  for (let i = 0; i < 3; i++) {
    if ((cells[0][i] == cells[1][i]) & (cells[1][i] == cells[2][i])) {
      return true;
    }
  }
  return false;
}

function checkDiag(cells) {
  if ((cells[0][0] == cells[1][1]) & (cells[1][1] == cells[2][2])) {
    return true;
  }
  if ((cells[0][2] == cells[1][1]) & (cells[1][1] == cells[2][0])) {
    return true;
  }
  return false;
}

const match_broker = {
  getPlayers: (id) => {
    const match = active_matches.get(id);
    if (!match) return undefined;
    return Array.from(match.players.values).map((value) => {
      online_broker.getUser(value.id);
    });
  },
  open: (player, config) => {
    if (active_matches.has(player.id)) {
      throw new Error("You already have a match");
    }
    const match = {};
    match.id = player.id;
    match.owner = player;
    match.first_player = player;
    match.players = new Map();
    match.roles = new Map();
    match.config = config;
    match.state = "waiting";
    match.cells = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];

    match.players.set(player.id, player);
    match.roles.set(player.id, "player");
    active_matches.set(match.id, match);
  },
  join: (player, id) => {
    const match = active_matches.get(id);
    if (!match) {
      throw new Error("Match not found");
    }
    let role = match.roles.get(player.id);
    if (role) {
      return role;
    }
    match.players.set(player.id, player);
    role = match.players.length == 2 ? "player" : "viewer";
    match.roles.set(player.id, role);
    return role;
  },
  start: (id, owner_id, player_id) => {
    const match = active_matches.get(id);
    if (!match) {
      throw new Error("Match not found");
    }
    if (match.state != "waiting") {
      throw new Error("Match started");
    }
    if (match.owner.id != owner_id) {
      throw new Error("You are not the owner");
    }
    const player = match.players.get(player_id);
    if (!player) {
      throw new Error("Player not found");
    }
    match.second_player = player;
    match.state = "start";
    for (let player of match.players) {
      const socket = online_broker.getUser(player.id);
      if (socket) {
        socket.emit("game", {
          type: "start",
          id: id,
          first_player: match.first_player,
          second_player: match.second_player,
        });
      }
    }
  },
  validate: (cells) => {
    return checkRow(cells) || checkCol(cells) || checkDiag(cells);
  },
  move: (id, player_id, i, j) => {
    const match = active_matches.get(id);
    if (!match) {
      throw new Error("Match not found");
    }
    if (match.state != "start") {
      throw new Error("Match started");
    }
    if (
      match.first_player.id != player_id ||
      match.second_player.id != player_id
    ) {
      throw new Error("You are not the player");
    }
    const player = match.players.get(player_id);
    const on_turn_player = match.on_turn_player;
    if (on_turn_player != player_id) {
      throw new Error("Not your turn");
    }
    if (on_turn_player.id != player_id || match.cells[i][j] != "") {
      throw new Error("Cell aready used");
    }
    const value = on_turn_player.id == match.owner.id ? "X" : "O";
    match.cells[i][j] = value;
    for (let player of match.players) {
      const socket = online_broker.getUser(player.id);
      if (socket) {
        socket.emit("game", {
          id: id,
          type: "move",
          i: i,
          j: j,
          value: value,
        });
      }
    }
    match.on_turn_player =
      on_turn_player.id == match.owner.id
        ? match.second_player
        : match.first_player;
    if (!this.validate(match.cells)) {
      end(id);
    }
  },
  end: (id) => {
    const match = active_matches.get(id);
    const on_turn_player = match.on_turn_player;
    for (let player of match.players) {
      const socket = online_broker.getUser(player.id);
      socket.emit("game", {
        id: id,
        type: "end",
        winner: on_turn_player,
      });
    }
  },
  getAllMatches: () => {
    return Array.from(active_matches.values());
  },
};

setInterval(() => {
  const current_time = new Date().getTime();
  const delete_set = [];
  for (let [key, match] of active_matches) {
    if (match.begin) {
      const config = match.config;
      const turn_start = match.turn_start;
      const on_turn_player = match.on_turn_player;
      if (current_time - turn_start >= config.max_seconds) {
        const player = online_broker.getUser(on_turn_player);
        if (player) {
          player.emit("game", {
            type: "timeout",
          });
        }
        match_broker.end(key);
      }
      delete_set.push(key);
    }
  }
  for (let id of delete_set) {
    active_matches.delete(id);
  }
}, 1000);
export default match_broker;
