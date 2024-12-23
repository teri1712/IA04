import matchDb from "../../models/match.js";
import online_broker from "./online-broker.js";
const message_broker = {
  onMessage: (message) => {
    for (let user of online_broker.getAllUser()) {
      user.socket.emit("message", {
        message: message,
        type: "global",
      });
    }
  },
  onMatchMessage: async (match_id, message) => {
    const players = await matchDb.getPlayers(match_id);
    for (let player of players) {
      const user = online_broker.getUser(player.user_id);
      if (user) {
        user.socket.emit("message", {
          type: "match",
          message: message,
        });
      }
    }
    return true;
  },
};

export default message_broker;
