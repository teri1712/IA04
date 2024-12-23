import { Router } from "express";
import match_broker from "./brokers/match-broker.js";
import matchDb from "../models/match.js";
import messageDb from "../models/message.js";

const matchRouter = Router();
const requestCache = new Map();

matchRouter.get("/join", async (req, res) => {
  const user = req.user;
  const match_id = req.query.match_id;
  try {
    await match_broker.join(match_id, user.id);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

matchRouter.get("/start", async (req, res) => {
  const user = req.user;
  const { player_id, player_name } = req.query;
  await match_broker.start(user, {
    id: player_id,
    name: player_name,
  });
  res.sendStatus(200);
});

matchRouter.post("/start", async (req, res) => {
  const user = req.user;
  const match_id = req.body.match_id;
  const match = await matchDb.get(match_id);
  if (match.state != "waiting") {
    return res.status(400).send("game started");
  }

  res.sendStatus(200);
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
  const matches = matchDb.getAllMatches();
  for (let match of matches) {
    match.players_length = match.players.size();
  }
  res.render("match", { matches: matches });
});

matchRouter.get("/user", async (req, res) => {
  const user = req.user;
  const match = await matchDb.getByUser(req.query.id);
  const partner = await matchDb.getPartner(match.id, match.user_id);
  if (!partner && (user.id != match.state) == "waiting") {
    res.sendStatus(400);
  }
  const owner = await matchDb.getPartner(match.id, match.user_id);
  const messages = await messageDb.getAllMatchMessages(match.id);
  res.render("tictac", {
    match: match,
    isPartner: partner && partner.user_id == user.id,
    isOwner: user.id == match.user_id,
    messages: messages,
    owner: owner,
    partner: partner,
  });
});
export default matchRouter;
