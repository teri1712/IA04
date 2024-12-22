import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import exphbs from "express-handlebars";
import passport from "passport";
import path from "path";
import fs from "fs";
import https from "https";
import OAuth2Strategy from "./game/custom-strategy.js";
import online_broker from "./views/game/online-broker.js";
import messageRouter from "./game/messageRouter.js";

const app = express();
const PORT = process.env.GAME_PORT;
const __dirname = path.resolve();
app.set("views", __dirname + "/views/game");

app.engine(
  "hbs",
  exphbs.engine({
    defaultLayout: "main.hbs",
    layoutsDir: path.join(app.get("views"), "layouts"),
    partialsDir: path.join(app.get("views"), "partials"),
  })
);
app.set("view engine", "hbs");
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});
passport.use(
  new OAuth2Strategy(
    {
      auth_uri: process.env.AUTHOURIZATION_URI,
      token_uri: process.env.TOKEN_URI,
      redirect_uri: process.env.REDIRECT_URI,
      userinfo_uri: process.env.USERINFO_URI,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    },
    function (accessToken, profile, done) {
      return done(null, {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        dob: profile.dob,
        avatar_url: profile.avatar_url,
        accessToken: accessToken,
      });
    }
  )
);

app.use((req, res, next) => {
  console.log("game: " + req.method + req.path);
  if (req.path.startsWith("/login")) {
    if (req.isAuthenticated()) {
      res.redirect("/");
    } else {
      next();
    }
    return;
  }
  if (!req.isAuthenticated() && !req.path.startsWith("/oauth2")) {
    res.redirect("/login");
    return;
  }
  if (req.isAuthenticated()) {
    online_broker.onOnline(req.user);
  }
  next();
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", (req, res) => {
  const queryParams = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    max_minutes: req.body.max_minutes,
  }).toString();
  res.redirect(process.env.AUTHORIZATION_URI + "?" + queryParams);
});

app.get(
  "/oauth2/redirect",
  passport.authenticate("oauth2-strategy", { failureRedirect: "/login" }),
  (req, res) => {
    let max_minutes = parseInt(req.query.max_minutes);
    req.session.cookie.expires = new Date(Date.now() + max_minutes * 1000);
    req.session.cookie.maxAge = max_minutes * 1000;
    online_broker.onOnline(req.user);

    res.redirect("/");
  }
);

app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.status(500);
    }
    res.redirect("/login");
  });
});

app.get("/", (req, res) => {
  res.render("home", {
    users: online_broker.getAllUser(),
  });
});

app.post("/ping", async (req, res) => {
  return res.status(200);
});

app.use("/", messageRouter);

// https
const options = {
  key: fs.readFileSync(process.env.SSL_SERVER_KEY),
  cert: fs.readFileSync(process.env.SSL_SERVER_CERT),
};
const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
