import express from "express";
import { v4 as uuidv4 } from "uuid";
import clientDb from "./models/client.js";
import userDb from "./models/user.js";

const credRouter = express.Router();

credRouter.get("/credentials", async (req, res) => {
  const user = await userDb.getByUsername(req.session.username);
  res.render("credentials", {
    client: await clientDb.getByUser(user),
  });
});
credRouter.post("/credentials", async (req, res) => {
  const user = await userDb.getByUsername(req.session.username);
  let client = await clientDb.getByUser(user);
  if (!client) {
    return res.status(400).send("client hasn't activated");
  }
  client.redirect_uri = req.body.redirect_uri;
  await clientDb.updateUri(client, req.body.redirect_uri);
  res.render("credentials", {
    client: client,
  });
});
credRouter.post("/activate", async (req, res) => {
  const user = await userDb.getByUsername(req.session.username);
  let client = await clientDb.getByUser(user);
  if (client) {
    return res.status(400).send("client already activated");
  }
  client = {};
  client.client_id = uuidv4();
  client.client_secret = uuidv4();
  client.redirect_uri = req.body.redirect_uri;
  client.user_id = user.id;

  await clientDb.create(client);
  res.render("credentials", {
    client: client,
  });
});

export default credRouter;
