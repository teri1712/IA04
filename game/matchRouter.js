import { Router } from "express";
import match_broker from "./brokers/match-broker.js";
import matchDb from "../models/match.js";
import messageDb from "../models/message.js";
import online_broker from "./brokers/online-broker.js";

const matchRouter = Router();
const requestCache = new Map();

matchRouter.get("/join", async (req, res) => {
  const user = req.user;
  const user_id = req.query.user_id;
  match_broker.join(user, user_id);
  res.redirect("/match/user?id=" + user_id);
});

matchRouter.get("/request", async (req, res) => {
  const user = req.user;
  const owner_id = req.query.user_id;
  const match = await matchDb.getByUser(owner_id);
  if (!match) {
    return res.status(400).send("Trạn đấu đã bắt đầu hoặc không tồn tại");
  }
  if (requestCache.has(owner_id)) {
    return res.status(400).send("Đã có người khác yêu cầu bắt đầu trận đáu.");
  }
  const user_online = online_broker.getUser(owner_id);
  if (!user_online) {
    return res.status(400).send("Người này hiện không online.");
  }
  user_online.emit("game", {
    type: "start",
    id: match.id,
    user: user,
  });
  res.request_user = user;
  requestCache.set(parseInt(owner_id), res);
});

matchRouter.post("/decline", async (req, res) => {
  const user = req.user;
  const cache = requestCache.get(parseInt(user.id));

  if (cache) {
    cache.status(400).send("Người này đã từ chối yêu cầu của bạn");
    requestCache.delete(user.id);
  }
});

matchRouter.post("/start", async (req, res) => {
  const user = req.user;
  const cache = requestCache.get(parseInt(user.id));
  if (!cache) {
    return res.sendStatus(400);
  }
  await match_broker.start(user, cache.request_user);
  requestCache.delete(user.id);
  res.redirect("/match/user?id=" + user.id);
  cache.redirect("/match/user?id=" + user.id);
});

matchRouter.post("/move", async (req, res) => {
  const user = req.user;
  const match_id = req.body.match_id;
  try {
    await match_broker.move(user, match_id);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

matchRouter.get("/", async (req, res) => {
  const user = req.user;
  const matches = await matchDb.getAllMatches();
  for (let match of matches) {
    match.available = match.state != "end";
    match.max_time = parseInt(match.max_time) / 1000;
    match.start = match.state == "start";
  }
  res.render("match", {
    matches: matches,
    has_match: await matchDb.getByUser(user.id),
    user: user,
  });
});

matchRouter.get("/user", async (req, res) => {
  const user = req.user;
  const match = await matchDb.getByUser(req.query.id);
  const owner = await matchDb.getPlayer(match.id, match.user_id);
  const messages = await messageDb.getAllMatchMessages(match.id);

  if (match.state == "waiting") {
    if (match.user_id != user.id) return res.sendStatus(400);

    res.render("match-owner", {
      match: JSON.stringify(match),
      messages: messages,
      owner: owner,
    });
  } else {
    const partner = await matchDb.getPartner(match.id, match.user_id);
    if (partner.user_id == user.id || match.user_id == user.id) {
      res.render("match-playing", {
        match: JSON.stringify(match),
        player: JSON.stringify(user),
        isEnd: match.state == "end",
        messages: messages,
        owner: owner,
        partner: partner,
      });
    } else {
      res.render("match-viewing", {
        match: JSON.stringify(match),
        viewer: JSON.stringify(user),
        messages: messages,
        owner: owner,
        partner: partner,
      });
    }
  }
});

matchRouter.get("/create", async (req, res) => {
  const user = req.user;
  res.render("match-create", { user: user });
});

matchRouter.post("/create", async (req, res) => {
  const user = req.user;
  const max_time = req.body.max_time;
  await match_broker.open(user, max_time);
  res.redirect("/match/user?id=" + user.id);
});

export default matchRouter;
