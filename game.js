import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import exphbs from "express-handlebars";
import passport from "passport";
import OAuth2Strategy from "./game/custom-strategy.js";
import { uuid } from "uuidv4";
const app = express();
const PORT = process.env.GAME_PORT;
const __dirname = path.resolve();
app.engine(
  "hbs",
  exphbs.engine({
    defaultLayout: "main.hbs",
    layoutsDir: "views/layouts",
    partialsDir: "views/partials",
    cookie: { maxAge: 30 * 60 * 1000 },
  })
);
app.set("view engine", "hbs");
app.set("views", __dirname + "/views/game");
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
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
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    },
    function (accessToken, profile, done) {
      return done(null, {
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        accessToken: accessToken,
      });
    }
  )
);

app.use((req, res, next) => {
  if (req.path.startsWith("/login")) {
    if (req.isAuthenticated()) {
      res.redirect("/");
    } else {
      next();
    }
    return;
  }
  if (!req.isAuthenticated()) {
    res.redirect("/login");
  }
  next();
});

app.get("/login", (req, res) => {
  res.render("login", {
    state: uuid(),
  });
});

app.get(
  "/redirect",
  passport.authenticate("oauth2-strategy", { failureRedirect: "/login" }),
  (req, res) => {
    let max_minutes = req.query.max_minutes;
    req.session.cookie.expires = new Date(Date.now() + max_minutes);
    req.session.cookie.maxAge = max_minutes;

    res.redirect("/");
  }
);

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500);
    }
    res.redirect("/login");
  });
});

app.get("/", async (req, res) => {});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
