import apicache from "apicache";
import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";

dotenv.config();

import * as eventsController from "./controllers/eventsController";
import * as flyersController from "./controllers/flyersController";
import * as homeController from "./controllers/homeController";
import * as messagesController from "./controllers/messagesController";
import * as weatherController from "./controllers/weatherController";
import * as transitController from "./controllers/transitController";

const app = express();

const cache = apicache.middleware;

app.set("port", process.env.PORT || 8080);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Relative to this file, not the working directory: systemd starts the server from "/"
app.use(express.static(path.join(__dirname, "../dist/public"), { maxAge: 0 }));
// Registered before the cache below: flyer images set their own 1-hour browser cache,
// which apicache would otherwise replace with 1 minute.
app.get("/api/flyers/:id", flyersController.flyerImage);
app.use("/api/*", cache("1 minute"));

app.get("/", homeController.index);
app.get("/config", homeController.config);
app.get("/offline", homeController.offline);
app.get("/demo", homeController.demo);
app.get("/api/transit", transitController.transit);
app.get("/api/weather", weatherController.weather);
app.get("/api/events", eventsController.events);
app.get("/api/flyers", flyersController.flyers);
app.get("/api/messages", messagesController.messages);

export default app;
