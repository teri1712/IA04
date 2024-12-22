import { Router } from "express";
import messageDb from "../models/message";
import online_broker from "../views/game/online-broker";

const messageRouter = express.Router();
async function getMessages(user, from, to) {
  const messages = await messageDb.getByTime(from, to);
  for (let message of messages) {
    message.isMine = message.from.id == user.id;
  }
  return messages;
}
messageRouter.get("/chat", async (req, res) => {
  const current_time = new Date().getTime();
  res.render("chat", {
    user: req.user,
    current_time: current_time,
    messages: await getMessages(req.user, -1, current_time),
  });
});

messageRouter.post("/message", async (req, res) => {
  await messageDb.create(req.user.id, req.body);
  return res.status(200);
});

messageRouter.get("/message", async (req, res) => {
  const { from, to } = req.query;
  const user = req.user;
  const messages = await getMessages(req.user, from, to);

  if (messages.length == 0) {
    online_broker.onListening(user, res);
    setTimeout(() => {
      online_broker.onTimeout(user, res);
    }, 3000);
    return;
  }
  return res.status(200).json({
    type: "message",
    messages: messages,
  });
});

export default messageRouter;
