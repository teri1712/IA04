import match_broker from "./match-broker.js";
import online_broker from "./online-broker.js";
const message_broker = {
  onMessage: (message) => {
    for (let socket of online_broker.getAllUser()) {
      socket.emit("message", {
        message: message,
        type: "global",
      });
    }
  },
  onMatchMessage(match_id, message) {
    const players = match_broker.getPlayers(match_id);
    if (!players) return false;
    for (let player of players)
      player.emit("message", {
        type: "match",
        message: message,
      });
    return true;
  },
};

export default message_broker;
