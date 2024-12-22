import express from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import clientDb from "../models/client.js";
import userDb from "../models/user.js";
import bcrypt from "bcrypt";

const oauth2Router = express.Router();

const authCodes = {};

// Authorization endpoint
oauth2Router.get("/authorize", async (req, res) => {
  const { client_id } = req.query;
  const client = await clientDb.getById(client_id);

  if (!client) {
    return res.status(400).send("client not found");
  }

  req.session.params = req.query;
  // Render login form
  res.render("oauth2-login", {
    client_id: client.client_id,
  });
});

// Oauth2 login endpoint
oauth2Router.post("/login", async (req, res) => {
  const { username, password, client_id } = req.body;

  const user = await userDb.getByUsername(username);
  if (!user) {
    res.render("/login", { message: "Username not exists" });
    return;
  }
  const client = await clientDb.getById(client_id);
  if (!client) {
    return res.status(401).send("client not exists");
  }

  bcrypt.compare(password, user.password, (err, same) => {
    if (err || !same) {
      res.render("oauth2-login", { message: "Wrong password" });
    } else {
      const code = uuidv4();
      authCodes[code] = {
        client_id: client_id,
        username: username,
      };
      setTimeout(() => {
        delete authCodes[code];
      }, 5000);
      // Redirect về client
      const params = req.session.params;
      params.code = code;
      const uri = `${client.redirect_uri}?${new URLSearchParams(
        params
      ).toString()}`;
      res.redirect(uri);
    }
  });
});

// Access token endpoint (dùng jwt)
oauth2Router.post("/token", async (req, res) => {
  const client_id = req.body.client_id;
  const client_secret = req.body.client_secret;
  const code = req.body.code;

  const client = await clientDb.getById(client_id);

  if (!client || client_secret != client.client_secret) {
    return res.status(401).send("Invalid client credentials");
  }

  const authCode = authCodes[code];

  if (!authCode) {
    return res.status(400).send("Invalid authorization code");
  }

  const payload = {
    username: authCode.username,
    client_id: authCode.client_id,
    issue_at: Math.floor(Date.now() / 1000),
    expire: Math.floor(Date.now() / 1000) + 60 * 60 * 30,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_KEY, {
    expiresIn: Math.floor(Date.now() / 1000) + 60 * 60 * 30 + "m",
  });

  res.send(accessToken);
});

// user info/resource endpoint
oauth2Router.get("/userinfo", (req, res) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).send("Missing Authorization Header");
  }

  const accessToken = header.split(" ")[1]; // beaer

  if (!accessToken) {
    return res.status(401).send("Invalid token");
  }
  jwt.verify(accessToken, process.env.JWT_KEY, async (err, claims) => {
    if (err) {
      return res.status(401).send("Invalid or expired token");
    }
    res.json(await userDb.getByUsername(claims.username));
  });
});

export default oauth2Router;
