import dotenv from "dotenv";
dotenv.config();

import express, { query } from "express";
import bcrypt from "bcrypt";
import session from "express-session";
import exphbs from "express-handlebars";
import userDb from "./models/user.js";
import fs from "fs";
import https from "https";
import upload from "./file-storage.js";

import oauth2Router from "./oauth2.js";
import credRouter from "./credentials.js";

const APP_SECRET = "20120220";

const app = express();
const PORT = process.env.PORT;
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
app.set("views", "./views");
app.use(express.static("./public"));
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: APP_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  console.log(req.path);
  if (req.path.startsWith("/login") || req.path.startsWith("/signUp")) {
    if (req.session.username) {
      res.redirect("/");
    } else {
      next();
    }
    return;
  }
  if (!req.path.startsWith("/oauth2") && !req.session.username) {
    res.redirect("/login");
    return;
  }
  next();
});

app.get("/login", async (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await userDb.getByUsername(username);
  if (!user) {
    res.render("login", { message: "Username not exists" });
    return;
  }
  bcrypt.compare(password, user.password, (err, same) => {
    if (err || !same) {
      res.render("login", { message: "Wrong password" });
    } else {
      req.session.username = username;
      res.redirect("/");
    }
  });
});

app.get("/signUp", (req, res) => {
  res.render("signUp");
});

app.post("/signUp", async (req, res) => {
  if (await userDb.getByUsername(req.body.username)) {
    res.render("signUp", { message: "Username exists" });
    return;
  }
  await userDb.create(req.body);
  req.session.username = req.body.username;
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500);
    }
    res.redirect("/login");
  });
});

app.get("/", async (req, res) => {
  const user = await userDb.getByUsername(req.session.username);
  const date = new Date(user.dob);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  user.dob = `${year}-${month}-${day}`;
  res.render("home", { user: user });
});

app.post("/avatar", upload.single("file"), async (req, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    return res.status(400).send("Error");
  }
  const user = await userDb.getByUsername(req.session.username);
  const old = user.avatar_url;
  if (old) {
    fs.unlinkSync("./public/avatar/" + old);
  }
  await userDb.updateAvatar(user, uploadedFile.filename);
  res.redirect("/");
});

app.use("/oauth2", oauth2Router);
app.use("/", credRouter);

// https
const options = {
  key: fs.readFileSync(process.env.SSL_SERVER_KEY),
  cert: fs.readFileSync(process.env.SSL_SERVER_CERT),
};
const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});