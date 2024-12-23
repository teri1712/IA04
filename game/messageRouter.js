import { json, Router } from "express";
import messageDb from "../models/message.js";
import message_broker from "./brokers/message-broker.js";

const messageRouter = Router();

messageRouter.get("/chat", async (req, res) => {
  const current_time = new Date().getTime();
  const messages = await messageDb.getAll(-1, to);
  for (let message of messages) {
    message.isMine = message.from.id == user.id;
  }
  res.render("chat", {
    user: JSON.stringify(req.user),
    current_time: current_time,
    messages: messages,
  });
});

messageRouter.post("/message", async (req, res) => {
  await messageDb.create(req.user.id, req.body);
  message_broker.onMessage(req.body);
  return res.status(200);
});

messageRouter.post("/match-message", async (req, res) => {
  const { match_id, message } = req.body;
  await messageDb.createMatchMessage(req.user, message, match_id);
  if (message_broker.onMatchMessage(match_id, message)) {
    return res.status(200);
  }
});

export default messageRouter;
