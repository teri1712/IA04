import matchDb from "../../models/match.js";
import match_broker from "./match-broker.js";
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
};

export default message_broker;
