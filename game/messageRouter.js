import { json, Router } from "express";
import messageDb from "../models/message.js";
import message_broker from "./brokers/message-broker.js";
import match_broker from "./brokers/match-broker.js";
import matchDb from "../models/match.js";

const messageRouter = Router();

messageRouter.get("/chat", async (req, res) => {
  const current_time = new Date().getTime();
  const user = req.user;
  const messages = await messageDb.getAll(-1, current_time);
  for (let message of messages) {
    message.isMine = message.user_id == user.id;
  }
  res.render("chat", {
    user: JSON.stringify(user),
    has_match: await matchDb.getByUser(user.id),
    current_time: current_time,
    messages: messages,
  });
});

messageRouter.post("/message", async (req, res) => {
  await messageDb.create(req.user.id, req.body);
  const message = {
    content: req.body,
    from: req.user,
  };
  message_broker.onMessage(message);
  return res.status(200);
});

messageRouter.post("/match-message", async (req, res) => {
  const user = req.user;
  const { user_id, message } = req.body;
  await match_broker.message(user_id, user.name, message);
  return res.status(200);
});

export default messageRouter;
