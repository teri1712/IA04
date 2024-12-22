import { Router } from "express";
import match_broker from "./brokers/match-broker.js";

const matchRouter = Router();
matchRouter.post("/start", async (req, res) => {
  const user = req.user;
  const match_id = req.body.match_id;
  try {
    match_broker.start(match_id, user.id);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send(err.message);
  }
});
matchRouter.post("/join", async (req, res) => {
  const user = req.user;
  const match_id = req.body.match_id;
  try {
    match_broker.join(user, match_id);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

matchRouter.post("/move", async (req, res) => {
  const user = req.user;
  const match_id = req.body.match_id;
  try {
    match_broker.move(user, match_id);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

matchRouter.get("/", async (req, res) => {
  const matches = match_broker.getAllMatches();
  for (let match of matches) {
    match.players_length = match.players.size();
  }
  res.render("match", { matches: matches });
});

matchRouter.get("/user", async (req, res) => {
  const match = match_broker.get(req.query.id);
});
export default matchRouter;
